import { pickClinic, rankClinicsByLoad } from './clinic-selection';

describe('pickClinic', () => {
  it('uses occupation percentage, then absolute count, then id', () => {
    expect(
      pickClinic([
        { id: 'b', capacity: 100, occupied: 10, reserved: 10 },
        { id: 'c', capacity: 50, occupied: 5, reserved: 5 },
        { id: 'a', capacity: 100, occupied: 10, reserved: 10 },
      ])
    ).toEqual('c');
  });
});

/**
 * A barra de equilíbrio do painel mostra a fila inteira, então o ranking precisa
 * ser o MESMO que decide a oferta do bot — senão o painel recomendaria uma
 * clínica e o bot escolheria outra com os mesmos dados.
 */
describe('rankClinicsByLoad', () => {
  it('ordena da menos para a mais carregada e concorda com pickClinic no topo', () => {
    const clinics = [
      { id: 'b', capacity: 100, occupied: 80, reserved: 0 },
      { id: 'c', capacity: 50, occupied: 5, reserved: 5 },
      { id: 'a', capacity: 100, occupied: 30, reserved: 10 },
    ];

    expect(rankClinicsByLoad(clinics).map((clinic) => clinic.id)).toEqual(['c', 'a', 'b']);
    expect(rankClinicsByLoad(clinics)[0].id).toEqual(pickClinic(clinics));
  });

  it('descarta clínica sem capacidade (não recebe agendamento)', () => {
    expect(
      rankClinicsByLoad([
        { id: 'sem-grade', capacity: 0, occupied: 0, reserved: 0 },
        { id: 'ativa', capacity: 10, occupied: 9, reserved: 0 },
      ]).map((clinic) => clinic.id)
    ).toEqual(['ativa']);
  });
});
