import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline do schema atual (19 tabelas + tipos + índices + FKs), gerado por
 * `pg_dump --schema-only` de um banco sincronizado a partir das entities
 * (`typeorm migration:generate` não funcionou nesta toolchain — Node 24 +
 * ts-node + TypeORM CLI colidem na resolução de `moduleResolution`; ver
 * histórico da task). Índices únicos parciais e CHECK constraints já batem
 * com os decorators das entities (`@Index`/`@Check`) — ver
 * `index-parity.spec.ts`/`check-parity.spec.ts`.
 *
 * RLS (ENABLE ROW LEVEL SECURITY + policies) é a PRÓXIMA migration — este
 * arquivo só cria tabelas/colunas/índices/FKs, nada de isolamento por tenant.
 */
export class InitialSchema1785453355756 implements MigrationInterface {
  name = 'InitialSchema1785453355756';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`


CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

CREATE TYPE public.organization_users_role_enum AS ENUM (
    'SUPER_ADMIN',
    'SA_MASTER',
    'SA_BILLING',
    'SA_USER',
    'ADMIN',
    'MANAGER',
    'COORDINATOR',
    'USER'
);

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id uuid,
    organization_id uuid,
    actor_user_id uuid,
    outcome character varying(16) DEFAULT 'allowed'::character varying NOT NULL,
    deny_reason character varying(64),
    cross_tenant boolean DEFAULT false NOT NULL,
    entity character varying NOT NULL,
    action character varying NOT NULL,
    data json NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;

CREATE TABLE public.companies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    document character varying(20),
    document_type character varying(10),
    website character varying(255),
    primary_email character varying(255),
    primary_phone character varying(20),
    segment character varying(100),
    owner_id uuid,
    created_by uuid,
    version integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);

CREATE TABLE public.company_field_values (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    company_id uuid NOT NULL,
    definition_id uuid NOT NULL,
    value_text text,
    value_number numeric(18,4),
    value_date timestamp without time zone,
    value_boolean boolean,
    value_options jsonb,
    updated_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.contact_emails (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    email_normalized character varying(255) NOT NULL,
    type character varying(20) DEFAULT 'OTHER'::character varying NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.contact_field_values (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    definition_id uuid NOT NULL,
    value_text text,
    value_number numeric(18,4),
    value_date timestamp without time zone,
    value_boolean boolean,
    value_options jsonb,
    updated_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.contact_phones (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    phone character varying(30) NOT NULL,
    phone_normalized character varying(20) NOT NULL,
    normalization_version smallint DEFAULT '1'::smallint NOT NULL,
    type character varying(20) DEFAULT 'OTHER'::character varying NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    is_valid boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.contacts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    company_id uuid,
    job_title character varying(120),
    document character varying(20),
    document_type character varying(10),
    primary_email character varying(255),
    primary_phone character varying(20),
    segment character varying(100),
    tags text DEFAULT ''::text,
    status character varying(20) DEFAULT 'LEAD'::character varying NOT NULL,
    merged_into_id uuid,
    owner_id uuid,
    created_by uuid,
    version integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);

CREATE TABLE public.custom_field_definitions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    scope character varying(20) NOT NULL,
    key character varying(60) NOT NULL,
    label character varying(120) NOT NULL,
    type character varying(20) NOT NULL,
    options jsonb,
    is_required boolean DEFAULT false NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    is_editable boolean DEFAULT true NOT NULL,
    "position" smallint DEFAULT '0'::smallint NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.deal_field_values (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    deal_id uuid NOT NULL,
    definition_id uuid NOT NULL,
    value_text text,
    value_number numeric(18,4),
    value_date timestamp without time zone,
    value_boolean boolean,
    value_options jsonb,
    updated_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.deal_stage_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    deal_id uuid NOT NULL,
    from_stage_id uuid,
    to_stage_id uuid NOT NULL,
    moved_by uuid,
    moved_at timestamp without time zone DEFAULT clock_timestamp() NOT NULL
);

CREATE TABLE public.deals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    pipeline_id uuid NOT NULL,
    stage_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    company_id uuid,
    title character varying(255) NOT NULL,
    value numeric(14,2) NOT NULL,
    currency character varying(3) DEFAULT 'BRL'::character varying NOT NULL,
    expected_close_date date,
    status character varying(10) DEFAULT 'OPEN'::character varying NOT NULL,
    lost_reason text,
    closed_at timestamp without time zone,
    owner_id uuid,
    created_by uuid,
    version integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    CONSTRAINT chk_deals_closed_at_matches_status CHECK (((closed_at IS NULL) = ((status)::text = 'OPEN'::text))),
    CONSTRAINT chk_deals_lost_reason_only_when_lost CHECK (((lost_reason IS NULL) OR ((status)::text = 'LOST'::text)))
);

CREATE TABLE public.interactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    company_id uuid,
    deal_id uuid,
    type character varying(20) DEFAULT 'NOTE'::character varying NOT NULL,
    direction character varying(20) DEFAULT 'NONE'::character varying NOT NULL,
    subject character varying(255),
    body text,
    occurred_at timestamp without time zone NOT NULL,
    duration_seconds integer,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);

CREATE TABLE public.organization_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role public.organization_users_role_enum DEFAULT 'USER'::public.organization_users_role_enum NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    joined_at timestamp without time zone,
    left_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.organizations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    plan_id uuid,
    name character varying(255) NOT NULL,
    alias character varying(255),
    cnpj character varying(18) NOT NULL,
    address text,
    logo_url character varying(500),
    white_label_settings jsonb DEFAULT '{}'::jsonb,
    subscription_settings jsonb DEFAULT '{}'::jsonb,
    status character varying(20) DEFAULT 'ACTIVATION'::character varying NOT NULL,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pipeline_stages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    pipeline_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    probability integer,
    type character varying(20) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pipelines (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.plans (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    limits jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    organization_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    contact_id uuid,
    company_id uuid,
    deal_id uuid,
    assignee_id uuid,
    due_at timestamp without time zone,
    priority character varying(20) DEFAULT 'MEDIUM'::character varying NOT NULL,
    status character varying(20) DEFAULT 'OPEN'::character varying NOT NULL,
    completed_at timestamp without time zone,
    completed_by uuid,
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    hash character varying(255),
    avatar_url text,
    must_change_password boolean DEFAULT false NOT NULL,
    settings json DEFAULT '{"defaultTheme": "light", "notifications": true, "sounds": true}'::json NOT NULL,
    preferences jsonb DEFAULT '{"theme": "system", "defaultDateRange": null}'::jsonb,
    is_super_admin boolean DEFAULT false NOT NULL,
    super_admin_role character varying(20),
    created_by uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);

ALTER TABLE ONLY public.contact_field_values
    ADD CONSTRAINT "PK_004b7fe2754ff68619d4aad066a" PRIMARY KEY (id);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY (id);

ALTER TABLE ONLY public.contact_phones
    ADD CONSTRAINT "PK_3263d07aba7c4dd305ee995148f" PRIMARY KEY (id);

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY (id);

ALTER TABLE ONLY public.company_field_values
    ADD CONSTRAINT "PK_63c3a3df927449ab4a4fc4a1a82" PRIMARY KEY (id);

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY (id);

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "PK_8c66f03b250f613ff8615940b4b" PRIMARY KEY (id);

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY (id);

ALTER TABLE ONLY public.deal_field_values
    ADD CONSTRAINT "PK_908f3d274c337d39b4343368688" PRIMARY KEY (id);

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT "PK_911b7416a6671b4148b18c18ecb" PRIMARY KEY (id);

ALTER TABLE ONLY public.custom_field_definitions
    ADD CONSTRAINT "PK_91f4cf6416f7aeb02c217005cb2" PRIMARY KEY (id);

ALTER TABLE ONLY public.deal_stage_history
    ADD CONSTRAINT "PK_92a1807e6b5c2694b06a430f77d" PRIMARY KEY (id);

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT "PK_92e43270eace072ad5182fc08e2" PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT "PK_af79a22d50256af35812ba60a87" PRIMARY KEY (id);

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY (id);

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY (id);

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT "PK_e38ea171cdfad107c1f3db2c036" PRIMARY KEY (id);

ALTER TABLE ONLY public.contact_emails
    ADD CONSTRAINT "PK_fe57f999770a7da0338a9b29db3" PRIMARY KEY (id);

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT "UQ_02de31f27a9dda3688a0172fc13" UNIQUE (cnpj);

ALTER TABLE ONLY public.company_field_values
    ADD CONSTRAINT "UQ_3a4594a585a25b105d37a223498" UNIQUE (company_id, definition_id);

ALTER TABLE ONLY public.contact_phones
    ADD CONSTRAINT "UQ_44bf25cdf03f463f1eda464ed48" UNIQUE (contact_id, phone_normalized);

ALTER TABLE ONLY public.deal_field_values
    ADD CONSTRAINT "UQ_46d93e7b7dd7902ef50cb818515" UNIQUE (deal_id, definition_id);

ALTER TABLE ONLY public.contact_emails
    ADD CONSTRAINT "UQ_6936c709c9096f74e32de20dffe" UNIQUE (contact_id, email_normalized);

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT "UQ_81fbbbb81d6b241363f82c17b09" UNIQUE (key);

ALTER TABLE ONLY public.custom_field_definitions
    ADD CONSTRAINT "UQ_8e5b35e7db14ea3f772b927b954" UNIQUE (organization_id, scope, key);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);

ALTER TABLE ONLY public.contact_field_values
    ADD CONSTRAINT "UQ_cb995a8db5a5bc89d0d461effb8" UNIQUE (contact_id, definition_id);

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT "UQ_e219642672d85627bd4e49f52be" UNIQUE (alias);

CREATE INDEX "IDX_0250f25ad31106f37d447898b6" ON public.deal_stage_history USING btree (organization_id);

CREATE INDEX "IDX_03fa4e874d41e7f3dc7f7f59b6" ON public.deal_field_values USING btree (definition_id, value_date);

CREATE INDEX "IDX_0799185e89f0eec8f7ec05a5bb" ON public.contacts USING btree (organization_id);

CREATE INDEX "IDX_0c1746303947d977009e912e11" ON public.company_field_values USING btree (definition_id, value_date);

CREATE INDEX "IDX_0d80284e242cf14cb50ed2dd99" ON public.pipeline_stages USING btree (organization_id, pipeline_id);

CREATE INDEX "IDX_1028b8ea7e4be4a11b65e2a32b" ON public.company_field_values USING btree (organization_id);

CREATE INDEX "IDX_182cce007191df620481ea45d6" ON public.companies USING btree (organization_id, name);

CREATE INDEX "IDX_1c9587845577fa1188b8e44274" ON public.deal_field_values USING btree (organization_id);

CREATE INDEX "IDX_1fa3a4c1ef6ebb369a0ef22e48" ON public.deal_stage_history USING btree (deal_id, moved_at);

CREATE INDEX "IDX_226b2e01ee7b2be2c1ad8a4395" ON public.interactions USING btree (organization_id);

CREATE INDEX "IDX_2cd10fda8276bb995288acfbfb" ON public.audit_logs USING btree (created_at);

CREATE INDEX "IDX_38d7b3a1f7758aeea64ea648fe" ON public.tasks USING btree (organization_id, assignee_id, status, due_at);

CREATE INDEX "IDX_44a9b5209cdfd6f72fb09a7c99" ON public.tasks USING btree (organization_id);

CREATE INDEX "IDX_4a99045ca7335fb66fa4a15f8a" ON public.companies USING btree (organization_id);

CREATE INDEX "IDX_5092e6e0676ff6721785529507" ON public.contact_field_values USING btree (definition_id, value_date);

CREATE INDEX "IDX_50d5ce8534b1d954f9aa7e090b" ON public.contacts USING btree (organization_id, company_id);

CREATE INDEX "IDX_5d5f096cb55cb0607d1b004343" ON public.pipeline_stages USING btree (organization_id);

CREATE INDEX "IDX_66bf89db57a378886366683dea" ON public.contact_field_values USING btree (definition_id, value_number);

CREATE INDEX "IDX_66f07197855ab0cf95c1ba3713" ON public.interactions USING btree (organization_id, contact_id, occurred_at);

CREATE INDEX "IDX_6ac4dc7b32989421f37cb1f937" ON public.deals USING btree (organization_id, contact_id);

CREATE INDEX "IDX_7561aa4c56343cfac190f868e5" ON public.pipelines USING btree (organization_id);

CREATE INDEX "IDX_79677361e93bc65d0232cb531e" ON public.contact_phones USING btree (organization_id, phone_normalized);

CREATE INDEX "IDX_878e8bde26d179360e9b8b07fb" ON public.tasks USING btree (organization_id, contact_id);

CREATE INDEX "IDX_87bc10045d6656600eca5815f1" ON public.contacts USING btree (organization_id, primary_email);

CREATE INDEX "IDX_9c2c0c4ca10def0d85aa6beef7" ON public.audit_logs USING btree (outcome);

CREATE INDEX "IDX_a16251082324a087e639538f08" ON public.deal_field_values USING btree (definition_id, value_number);

CREATE INDEX "IDX_af094699bfc1419c6ee7dbc966" ON public.deals USING btree (organization_id, pipeline_id, stage_id);

CREATE INDEX "IDX_b341b04d4c6550555effe06bf7" ON public.contact_field_values USING btree (definition_id, value_text);

CREATE INDEX "IDX_c71fd12935f08812f56f5104a3" ON public.company_field_values USING btree (definition_id, value_number);

CREATE INDEX "IDX_cd9a8f9f3244e92133bac3cf83" ON public.deal_field_values USING btree (definition_id, value_text);

CREATE INDEX "IDX_d08be7f029a59a5cc54171b2c0" ON public.company_field_values USING btree (definition_id, value_text);

CREATE INDEX "IDX_d621d3a98f9c461895a792618c" ON public.contact_emails USING btree (organization_id, email_normalized);

CREATE INDEX "IDX_e9ef7ffc8c5f7b0abbaaf8d677" ON public.custom_field_definitions USING btree (organization_id, scope);

CREATE UNIQUE INDEX "IDX_ef2d3488875cb7728f5375c766" ON public.organization_users USING btree (organization_id, user_id);

CREATE INDEX "IDX_f160d97a931844109de9d04228" ON public.audit_logs USING btree (actor_user_id);

CREATE INDEX "IDX_f230a7e3eddfae196239343ae9" ON public.deals USING btree (organization_id);

CREATE UNIQUE INDEX uq_companies_org_document ON public.companies USING btree (organization_id, document) WHERE ((document IS NOT NULL) AND (deleted_at IS NULL));

CREATE UNIQUE INDEX uq_contacts_org_document ON public.contacts USING btree (organization_id, document) WHERE ((document IS NOT NULL) AND (deleted_at IS NULL));

CREATE UNIQUE INDEX uq_pipelines_org_default ON public.pipelines USING btree (organization_id) WHERE (is_default = true);

ALTER TABLE ONLY public.deal_stage_history
    ADD CONSTRAINT "FK_0250f25ad31106f37d447898b63" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.deal_stage_history
    ADD CONSTRAINT "FK_073f62f53839beb06c39ee65b82" FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "FK_0799185e89f0eec8f7ec05a5bb8" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT "FK_095c5c2bd5c0e3d7e899e5b20e6" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE ONLY public.contact_emails
    ADD CONSTRAINT "FK_17eeaabe0b4b4beca50e632f65c" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.company_field_values
    ADD CONSTRAINT "FK_181f49a34fc480d6c6a9f6ec879" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT "FK_226b2e01ee7b2be2c1ad8a4395f" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "FK_23f5265469e4b4daea988d91465" FOREIGN KEY (stage_id) REFERENCES public.pipeline_stages(id);

ALTER TABLE ONLY public.company_field_values
    ADD CONSTRAINT "FK_30cf9e574f88d174baab5858419" FOREIGN KEY (definition_id) REFERENCES public.custom_field_definitions(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.deal_field_values
    ADD CONSTRAINT "FK_3380c29f7364adb55b0f5484d05" FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.contact_phones
    ADD CONSTRAINT "FK_34a49ed9ce0d3668c17051399db" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT "FK_37b689c446ebe79ecd37e445735" FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "FK_44a9b5209cdfd6f72fb09a7c994" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "FK_4a99045ca7335fb66fa4a15f8ae" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "FK_5489b511b5347d806677939151f" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT "FK_5af9084f0be89dc2db47754aa18" FOREIGN KEY (plan_id) REFERENCES public.plans(id);

ALTER TABLE ONLY public.pipeline_stages
    ADD CONSTRAINT "FK_5d5f096cb55cb0607d1b0043432" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.deal_field_values
    ADD CONSTRAINT "FK_5f0cd464756e01887ba336dd09c" FOREIGN KEY (definition_id) REFERENCES public.custom_field_definitions(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.contact_field_values
    ADD CONSTRAINT "FK_605f571bc1996f800e74b740417" FOREIGN KEY (definition_id) REFERENCES public.custom_field_definitions(id) ON DELETE RESTRICT;

ALTER TABLE ONLY public.contact_field_values
    ADD CONSTRAINT "FK_6822f2ccb42d0e20e2d2a78177e" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pipelines
    ADD CONSTRAINT "FK_7561aa4c56343cfac190f868e5c" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "FK_76e504b6bb116e6cdc2ee6a0cb5" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT "FK_850fda09e6a73f03b7949ddc06c" FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT "FK_95b8c949b2851f87e2e4d48c891" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "FK_9e8ce2b9d84c7fb97105ce7f007" FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id);

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "FK_a14d7d609f64c45c3a054b97ba4" FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "FK_ac270d32a01ee22d2e98a8f8532" FOREIGN KEY (owner_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT "FK_bf4d20f80f6fdd7dbfa711f18cc" FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT "FK_df63e1563bbd91b428b5c50d8ad" FOREIGN KEY (owner_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "FK_eb4869da6d8f7121b269140994d" FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT "FK_f230a7e3eddfae196239343ae97" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS
        deal_field_values, deal_stage_history, deals, tasks, interactions,
        pipeline_stages, pipelines, custom_field_definitions,
        contact_field_values, company_field_values, contact_phones,
        contact_emails, contacts, companies, organization_users,
        organizations, plans, audit_logs, users
      CASCADE;
      DROP TYPE IF EXISTS organization_users_role_enum;
    `);
  }
}
