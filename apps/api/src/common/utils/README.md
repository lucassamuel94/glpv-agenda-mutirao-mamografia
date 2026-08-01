# Utilitários Comuns

## DateFormatter

Utilitário para formatação de datas brasileiras com suporte a timezone configurável.

### Instalação

O utilitário já está disponível em `src/common/utils/date-formatter.ts` e usa as seguintes dependências:

- `date-fns` - para manipulação de datas
- `date-fns-tz` - para suporte a timezone

### Configuração

Adicione no seu arquivo `.env`:

```bash
TIMEZONE=America/Sao_Paulo
```

### Uso

#### 1. Formatação básica (usa timezone do .env)

```typescript
import { DateFormatter } from "../../../common/utils/date-formatter";

// No seu DTO
@Transform(({ value }) => DateFormatter.formatBrazilianDateToISO(value))
cnh_expiry: string;

// Ou em qualquer lugar do código
const isoDate = DateFormatter.formatBrazilianDateToISO("10/10/2029");
// Resultado: "2029-10-10"
```

#### 2. Formatação com timezone específico

```typescript
import { DateFormatter } from '../../../common/utils/date-formatter';

const isoDate = DateFormatter.formatBrazilianDateToISOWithTimezone(
  '10/10/2029',
  'America/New_York'
);
// Resultado: "2029-10-10" (no timezone de Nova York)
```

#### 3. Conversão reversa (ISO para brasileiro)

```typescript
import { DateFormatter } from '../../../common/utils/date-formatter';

// Para retorno ao frontend
const brazilianDate = DateFormatter.formatISOToBrazilianDate('2029-10-10');
// Resultado: "10/10/2029"
```

#### 4. Validação de data

```typescript
import { DateFormatter } from '../../../common/utils/date-formatter';

const isValid = DateFormatter.isValidBrazilianDate('10/10/2029');
// Resultado: true

const isInvalid = DateFormatter.isValidBrazilianDate('32/13/2029');
// Resultado: false
```

### Exemplos de uso em DTOs

#### Driver DTO (Criação/Atualização)

```typescript
@Transform(({ value }) => DateFormatter.formatBrazilianDateToISO(value))
cnh_expiry: string;
```

#### Driver DTO (Listagem/Filtros)

```typescript
@Transform(({ value }) => {
  // Para filtros de busca, converte DD/MM/YYYY para YYYY-MM-DD
  // NOTA: Para retorno ao frontend, use DateFormatter.formatISOToBrazilianDate()
  return DateFormatter.formatBrazilianDateToISO(value);
})
cnh_expiry?: string;
```

#### Trip DTO

```typescript
@Transform(({ value }) => DateFormatter.formatBrazilianDateToISO(value))
start_date: string;

@Transform(({ value }) => DateFormatter.formatBrazilianDateToISO(value))
end_date: string;
```

#### Cost DTO

```typescript
@Transform(({ value }) => DateFormatter.formatBrazilianDateToISO(value))
date: string;
```

### Uso em Serviços para Retorno ao Frontend

```typescript
import { DateFormatter } from '../../../common/utils/date-formatter';

// No seu serviço, ao retornar dados para o frontend
const driver = await this.driverRepository.findById(id);
return {
  ...driver,
  cnh_expiry: DateFormatter.formatISOToBrazilianDate(driver.cnh_expiry),
  // Agora retorna "10/10/2029" em vez de "2029-10-10"
};
```

#### Exemplo completo no DriversService:

```typescript
export class DriversService {
  /**
   * Formata as datas de um motorista para o formato brasileiro
   */
  private formatDriverDates(driver: Driver) {
    return {
      ...driver,
      cnh_expiry: driver.cnh_expiry
        ? DateFormatter.formatISOToBrazilianDate(driver.cnh_expiry.toISOString().split('T')[0])
        : null,
      created_at: driver.created_at
        ? DateFormatter.formatISOToBrazilianDate(driver.created_at.toISOString().split('T')[0])
        : null,
      updated_at: driver.updated_at
        ? DateFormatter.formatISOToBrazilianDate(driver.updated_at.toISOString().split('T')[0])
        : null,
    };
  }

  /**
   * Lista motoristas com filtros e paginação
   */
  async listDriversComFiltros(filters: ListDriversDto) {
    const result = await this.driverRepository.findWithFilters(organizationId, filters);

    // Formata as datas para o formato brasileiro antes de retornar
    const formattedData = result.data.map((driver) => this.formatDriverDates(driver));

    return {
      ...result,
      data: formattedData,
    };
  }

  /**
   * Obtém um motorista por ID
   */
  async getDriver(id: string) {
    const motorista = await this.driverRepository.findById(id, organizationId);
    if (!motorista) {
      throw new NotFoundException(`Motorista com ID ${id} não encontrado`);
    }

    // Formata as datas para o formato brasileiro antes de retornar
    return this.formatDriverDates(motorista);
  }
}
```

### Arquitetura Recomendada

**✅ Backend responsabilidades:**

- Receber datas no formato brasileiro (DD/MM/YYYY)
- Converter para formato ISO (YYYY-MM-DD) para armazenamento
- Retornar datas no formato ISO (YYYY-MM-DD)

**✅ Frontend responsabilidades:**

- Formatar datas para exibição (DD/MM/YYYY)
- Usar bibliotecas como `date-fns`, `moment.js` ou `dayjs`
- Implementar formatação localizada por região

#### Exemplo de implementação no Frontend:

```typescript
// Usando date-fns
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatDateToBrazilian = (isoDate: string) => {
  const date = parseISO(isoDate);
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
};

// Uso
const brazilianDate = formatDateToBrazilian('2029-10-10');
// Resultado: "10/10/2029"
```

#### Vantagens desta abordagem:

- 🎯 **Separação de responsabilidades** - backend foca em dados, frontend foca em apresentação
- 🚀 **Performance** - sem processamento desnecessário no backend
- 🌍 **Flexibilidade** - frontend pode formatar para qualquer locale/região
- 🔧 **Manutenibilidade** - lógica de formatação centralizada no frontend
- 📱 **Responsividade** - formatação adaptada ao dispositivo/usuário

### Vantagens

- ✅ **Reutilizável** - use em qualquer DTO ou serviço
- ✅ **Configurável** - timezone definido no .env
- ✅ **Consistente** - mesmo comportamento em toda aplicação
- ✅ **Testável** - fácil de testar isoladamente
- ✅ **Manutenível** - lógica centralizada em um lugar
- ✅ **Flexível** - suporte a timezones específicos
- ✅ **Bidirecional** - converte em ambas as direções

### Timezones suportados

Exemplos de timezones válidos:

- `America/Sao_Paulo` - Brasil (padrão)
- `America/New_York` - Nova York
- `Europe/London` - Londres
- `Asia/Tokyo` - Tóquio
- `Australia/Sydney` - Sydney

### Tratamento de erros

O utilitário é robusto e:

- Retorna o valor original se a formatação falhar
- Loga erros para debugging
- Não quebra a aplicação em caso de dados inválidos
