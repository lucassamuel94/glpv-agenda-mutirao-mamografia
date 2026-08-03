import { WaitingListController } from './waiting-list.controller';

describe('WaitingListController', () => {
  it('delegates entry creation to the service', async () => {
    const add = jest.fn().mockResolvedValue({ id: 'entry' });
    const controller = new WaitingListController({
      add,
      list: jest.fn(),
      remove: jest.fn(),
      markContacted: jest.fn(),
    } as never);
    await expect(
      controller.create({ patient_id: 'patient', phone: '34999999999' })
    ).resolves.toEqual({ id: 'entry' });
    expect(add).toHaveBeenCalledWith({ patient_id: 'patient', phone: '34999999999' });
  });

  it('delegates marking as contacted to the service', async () => {
    const markContacted = jest.fn().mockResolvedValue(undefined);
    const controller = new WaitingListController({
      add: jest.fn(),
      list: jest.fn(),
      remove: jest.fn(),
      markContacted,
    } as never);

    await expect(controller.markContacted('entry-id')).resolves.toEqual({ success: true });
    expect(markContacted).toHaveBeenCalledWith('entry-id');
  });
});
