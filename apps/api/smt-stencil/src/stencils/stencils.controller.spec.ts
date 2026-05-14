import { NotFoundException } from '@nestjs/common';
import { StencilsController } from './stencils.controller';
import { StencilsService } from './stencils.service';

jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

describe('StencilsController', () => {
  function makeController(
    serviceOverrides: Partial<Record<keyof StencilsService, jest.Mock>> = {},
  ) {
    const service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findDetailByStencilCode: jest.fn(),
      findRecentWashes: jest.fn(),
      createWash: jest.fn(),
      createWashByStencilCode: jest.fn(),
      findLines: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      ...serviceOverrides,
    } as unknown as jest.Mocked<StencilsService>;

    return {
      controller: new StencilsController(service),
      service,
    };
  }

  it('passes list filters to the service', async () => {
    const { controller, service } = makeController({
      findAll: jest.fn().mockResolvedValue([]),
    });

    await expect(
      controller.findAll(
        'A-019',
        'MNF',
        'Brasil',
        'active',
        'Line 1',
        '2',
        '15',
      ),
    ).resolves.toEqual([]);
    expect(service.findAll).toHaveBeenCalledWith({
      stencilCode: 'A-019',
      manufactureId: 'MNF',
      country: 'Brasil',
      status: 'active',
      lineName: 'Line 1',
      page: 2,
      limit: 15,
    });
  });

  it('passes recent wash filters to the service', () => {
    const { controller, service } = makeController({
      findRecentWashes: jest.fn().mockReturnValue({ items: [] }),
    });

    expect(controller.findRecentWashes('1', '10', 'true')).toEqual({
      items: [],
    });
    expect(service.findRecentWashes).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      attentionOnly: true,
    });
  });

  it('returns stencil detail by id', async () => {
    const detail = { id: 'stencil_1', stencilCode: 'A-019' };
    const { controller } = makeController({
      findOne: jest.fn().mockResolvedValue(detail),
    });

    await expect(controller.findOne('stencil_1')).resolves.toBe(detail);
  });

  it('throws not found when stencil id does not exist', async () => {
    const { controller } = makeController({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await expect(controller.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns stencil detail by QR code', async () => {
    const detail = { id: 'stencil_1', stencilCode: 'A-019' };
    const { controller } = makeController({
      findDetailByStencilCode: jest.fn().mockResolvedValue(detail),
    });

    await expect(controller.findByCode('A-019')).resolves.toBe(detail);
  });

  it('throws not found when QR code does not exist', async () => {
    const { controller } = makeController({
      findDetailByStencilCode: jest.fn().mockResolvedValue(null),
    });

    await expect(controller.findByCode('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates wash by stencil id', async () => {
    const wash = { id: 'stencil_wash_1', operator: 'Carlos Souza' };
    const { controller, service } = makeController({
      createWash: jest.fn().mockResolvedValue(wash),
    });

    await expect(
      controller.createWash('stencil_1', { operator: 'Carlos Souza' }),
    ).resolves.toBe(wash);
    expect(service.createWash).toHaveBeenCalledWith('stencil_1', {
      operator: 'Carlos Souza',
    });
  });

  it('creates wash by stencil QR code', async () => {
    const wash = { id: 'stencil_wash_1', operator: 'Carlos Souza' };
    const { controller, service } = makeController({
      createWashByStencilCode: jest.fn().mockResolvedValue(wash),
    });

    await expect(
      controller.createWashByCode('A-019', { operator: 'Carlos Souza' }),
    ).resolves.toBe(wash);
    expect(service.createWashByStencilCode).toHaveBeenCalledWith('A-019', {
      operator: 'Carlos Souza',
    });
  });

  it('throws not found when creating wash for missing stencil', async () => {
    const { controller } = makeController({
      createWash: jest.fn().mockResolvedValue(null),
      createWashByStencilCode: jest.fn().mockResolvedValue(null),
    });

    await expect(
      controller.createWash('missing', { operator: 'Carlos Souza' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      controller.createWashByCode('missing', { operator: 'Carlos Souza' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws not found when updating or deleting missing stencil', async () => {
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
