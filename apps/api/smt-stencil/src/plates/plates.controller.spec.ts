import { NotFoundException } from '@nestjs/common';
import { PlatesController } from './plates.controller';
import { PlatesService } from './plates.service';

jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

describe('PlatesController', () => {
  function makeController(
    serviceOverrides: Partial<Record<keyof PlatesService, jest.Mock>> = {},
  ) {
    const service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findRecentWashes: jest.fn(),
      createWash: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      ...serviceOverrides,
    } as unknown as jest.Mocked<PlatesService>;

    return {
      controller: new PlatesController(service),
      service,
    };
  }

  it('passes filters to the service', async () => {
    const { controller, service } = makeController({
      findAll: jest.fn().mockResolvedValue([]),
    });

    await expect(
      controller.findAll('PCB', 'BLANK', 'SERIAL', 'Linha 1', '2', '15'),
    ).resolves.toEqual([]);
    expect(service.findAll).toHaveBeenCalledWith({
      plate_model: 'PCB',
      blank_id: 'BLANK',
      serial: 'SERIAL',
      line: 'Linha 1',
      page: 2,
      limit: 15,
    });
  });

  it('passes recent wash filters to the service', () => {
    const { controller, service } = makeController({
      findRecentWashes: jest.fn().mockReturnValue({ items: [] }),
    });

    expect(controller.findRecentWashes('1', '10')).toEqual({ items: [] });
    expect(service.findRecentWashes).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it('returns plate detail by id', async () => {
    const detail = { id: 'plate_1', serial: 'PCB-1000-000001' };
    const { controller } = makeController({
      findOne: jest.fn().mockResolvedValue(detail),
    });

    await expect(controller.findOne('plate_1')).resolves.toBe(detail);
  });

  it('throws not found when plate id does not exist', async () => {
    const { controller } = makeController({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates wash by plate id', async () => {
    const wash = { id: 'plate_wash_1', operator: 'Maria Santos' };
    const { controller, service } = makeController({
      createWash: jest.fn().mockResolvedValue(wash),
    });

    await expect(
      controller.createWash('plate_1', {
        operator: 'Maria Santos',
        shift: 2,
        phase: 1,
      }),
    ).resolves.toBe(wash);
    expect(service.createWash).toHaveBeenCalledWith('plate_1', {
      operator: 'Maria Santos',
      shift: 2,
      phase: 1,
    });
  });

  it('throws not found when creating wash for missing plate', async () => {
    const { controller } = makeController({
      createWash: jest.fn().mockResolvedValue(null),
    });

    await expect(
      controller.createWash('missing', {
        operator: 'Maria Santos',
        shift: 2,
        phase: 1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws not found when updating or deleting missing plate', async () => {
    const { controller } = makeController({
      update: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(null),
    });

    await expect(controller.update('missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(controller.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
