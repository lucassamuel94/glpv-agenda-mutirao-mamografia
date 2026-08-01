# Template para Implementação de Seleção de Campos no findOne

Este template pode ser usado para implementar a funcionalidade de seleção de campos no método `findOne` de qualquer módulo.

## 1. Criar DTO de Seleção de Campos

```typescript
// src/modules/[module-name]/dto/find-one-[entity].dto.ts
import { IsOptional, IsString, IsArray, IsIn } from "class-validator";
import { Transform } from "class-transformer";
import { SelectFieldsDto } from "../../../common/dto/select-fields.dto";

export class FindOne[Entity]Dto extends SelectFieldsDto {
  @IsOptional()
  @IsArray({ message: "Campos deve ser um array de strings" })
  @IsString({ each: true, message: "Cada campo deve ser uma string" })
  @IsIn([
    // Listar todos os campos disponíveis da entidade
    "id", "name", "created_at", "updated_at"
  ], { each: true, message: "Campo inválido para seleção" })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").map(field => field.trim()).filter(field => field.length > 0);
    }
    return value;
  })
  override fields?: string[];

  @IsOptional()
  @IsString({ message: "Incluir relações deve ser uma string separada por vírgulas" })
  @Transform(({ value }) => {
    if (typeof value === "string") {
      return value.split(",").map(relation => relation.trim()).filter(relation => relation.length > 0);
    }
    return value;
  })
  include?: string[];
}
```

## 2. Atualizar Repository

```typescript
// src/repositories/[entity].repository.ts

/**
 * Busca entidade por ID e empresa com seleção de campos
 */
async findByIdAndOrganizationWithFields(
  id: string,
  organizationId: string,
  fields?: string[],
  include?: string[]
): Promise<[Entity] | null> {
  const queryBuilder = this.[entity]Repository
    .createQueryBuilder("[entity]")
    .where("[entity].id = :id", { id })
    .andWhere("[entity].organization_id = :organizationId", { organizationId });

  // Selecionar campos específicos se fornecidos
  if (fields && fields.length > 0) {
    const selectFields = fields.map(field => `[entity].${field}`);
    queryBuilder.select(selectFields);
  }

  // Incluir relações se especificadas
  if (include && include.length > 0) {
    include.forEach(relation => {
      switch (relation) {
        case "relation1":
          queryBuilder.leftJoinAndSelect("[entity].relation1", "relation1");
          break;
        case "relation2":
          queryBuilder.leftJoinAndSelect("[entity].relation2", "relation2");
          break;
        // Adicionar outras relações conforme necessário
      }
    });
  }

  return queryBuilder.getOne();
}
```

## 3. Atualizar Service

```typescript
// src/modules/[module-name]/[module-name].service.ts

/**
 * Busca entidade por ID com seleção de campos
 */
async findOneWithFields(
  id: string,
  fields?: string[],
  include?: string[]
): Promise<[Entity]> {
  const organizationId = this.requestContextService.getOrganizationId();
  const entity = await this.[entity]Repository.findByIdAndOrganizationWithFields(
    id,
    organizationId,
    fields,
    include
  );

  if (!entity) {
    throw new NotFoundException("[Entity] não encontrado");
  }

  return entity;
}
```

## 4. Atualizar Controller

```typescript
// src/modules/[module-name]/[module-name].controller.ts

import { FindOne[Entity]Dto } from "./dto";

/**
 * Busca entidade por ID
 * GET /api/[module-name]/:id
 */
@Get(":id")
@ApiQuery({
  name: "fields",
  required: false,
  description: "Campos específicos a serem retornados (separados por vírgula)",
  example: "id,name,created_at",
  type: String,
})
@ApiQuery({
  name: "include",
  required: false,
  description: "Relações a serem incluídas (separadas por vírgula)",
  example: "relation1,relation2",
  type: String,
})
async findOne(
  @Param("id", ParseUUIDPipe) id: string,
  @Query(new ValidationPipe({ transform: true, whitelist: true }))
  filters: FindOne[Entity]Dto
) {
  const entity = await this.[moduleName]Service.findOneWithFields(
    id,
    filters.fields,
    filters.include
  );

  return {
    statusCode: HttpStatus.OK,
    message: "[Entity] encontrado",
    data: entity,
  };
}
```

## 5. Atualizar Exports

```typescript
// src/modules/[module-name]/dto/index.ts
export { FindOne[Entity]Dto } from "./find-one-[entity].dto";
```

## 6. Documentação

Criar arquivo `README.md` no módulo explicando:

- Parâmetros disponíveis
- Exemplos de uso
- Benefícios
- Práticas recomendadas

## Checklist de Implementação

- [ ] Criar DTO de seleção de campos
- [ ] Adicionar método no repository
- [ ] Adicionar método no service
- [ ] Atualizar controller
- [ ] Atualizar exports
- [ ] Criar documentação
- [ ] Testar funcionalidade
- [ ] Validar campos permitidos
- [ ] Validar relações disponíveis
