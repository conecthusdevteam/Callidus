import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Stencil, WashStatus } from './entities/stencil.entity';
import { StencilWash } from './entities/stencil-wash.entity';
import { StencilsService } from './stencils.service';

jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

describe('StencilsService', () => {
  function makeRepository(overrides: Partial<Record<keyof Repository<Stencil>, jest.Mock>> = {}) {
    return {
      create: jest.fn((dto) => dto),
      save: jest.fn(async (entity) => ({ id: 'stencil_saved', ...entity })),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn((entity, dto) => Object.assign(entity, dto)),
      remove: jest.fn(async (entity) => entity),
      createQueryBuilder: jest.fn(),
      ...overrides,
    } as unknown as jest.Mocked<Repository<Stencil>>;
  }

  function makeWashRepository(overrides: Partial<Record<keyof Repository<StencilWash>, jest.Mock>> = {}) {
    return {
      create: jest.fn((dto) => dto),
      save: jest.fn(async (entity) => ({ id: 'stencil_wash_saved', ...entity })),
      ...overrides,
    } as unknown as jest.Mocked<Repository<StencilWash>>;
  }

  function makeService(
    repository: jest.Mocked<Repository<Stencil>>,
    washRepository = makeWashRepository(),
  ) {
    return new StencilsService(repository, washRepository);
  }

  function makeServiceWithStencil(stencil: Stencil) {
    const repository = {
      findOne: jest.fn().mockResolvedValue(stencil),
    } as unknown as Repository<Stencil>;

    return new StencilsService(repository, makeWashRepository());
  }

  function makeWash(id: string, createdAt: string): StencilWash {
    return {
      id,
      operator: 'Carlos Souza',
      createdAt: new Date(createdAt),
    } as StencilWash;
  }

  function makeStencil(overrides: Partial<Stencil> = {}): Stencil {
    return {
      id: 'stencil_1',
      stencilCode: 'A-019',
      manufactureId: 'MNF-001',
      country: 'Brasil',
      thickness: 0.12,
      addressing: 19,
      lineName: 'Linha 1',
      status: WashStatus.ACTIVE,
      createdAt: new Date('2026-05-10T00:00:00.000Z'),
      updatedAt: new Date('2026-05-10T00:00:00.000Z'),
      washes: [],
      ...overrides,
    } as Stencil;
  }

  it('creates a stencil when code is unique', async () => {
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(null),
    });

    const dto = {
      stencilCode: 'A-019',
      manufactureId: 'MNF-001',
      country: 'Brasil',
      thickness: 0.12,
      addressing: 19,
      lineName: 'Linha 1',
      status: WashStatus.ACTIVE,
    };

    await expect(makeService(repository).create(dto)).resolves.toMatchObject({
      id: 'stencil_saved',
      stencilCode: 'A-019',
    });
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(dto);
  });

  it('throws conflict when stencil code already exists', async () => {
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(makeStencil()),
    });

    await expect(makeService(repository).create({
      stencilCode: 'A-019',
      manufactureId: 'MNF-001',
      country: 'Brasil',
      thickness: 0.12,
      addressing: 19,
      lineName: 'Linha 1',
    })).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('lists stencil summaries with code and line filters', async () => {
    const repository = makeRepository({
      find: jest.fn().mockResolvedValue([
        makeStencil({
          washes: [
            makeWash('wash_1', '2026-05-10T00:00:00.000Z'),
            makeWash('wash_2', '2026-05-10T08:00:00.000Z'),
          ],
        }),
      ]),
    });

    const result = await makeService(repository).findAll({ codigo: 'A-0', linha: 'Linha 1' });

    expect(repository.find).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        stencilCode: expect.any(Object),
        lineName: 'Linha 1',
      }),
      relations: { washes: true },
      order: { createdAt: 'DESC' },
    }));
    expect(result).toEqual([
      expect.objectContaining({
        codigo: 'A-019',
        total_lavagens: 2,
        intervalo_medio: 480,
        possui_anomalia: true,
      }),
    ]);
  });

  it('returns stencil history ordered by newest wash and calculates intervals and anomaly', async () => {
    const stencil = makeStencil({
      stencilCode: 'A-020',
      manufactureId: 'MNF-002',
      thickness: 0.1,
      addressing: 20,
      washes: [
        makeWash('wash_1', '2026-05-10T00:00:00.000Z'),
        makeWash('wash_2', '2026-05-10T08:00:00.000Z'),
        makeWash('wash_3', '2026-05-10T16:00:00.000Z'),
        makeWash('wash_4', '2026-05-11T00:00:00.000Z'),
        makeWash('wash_5', '2026-05-12T04:00:00.000Z'),
      ],
    });

    const result = await makeServiceWithStencil(stencil).findOne(stencil.id);

    expect(result).toMatchObject({
      id: 'stencil_1',
      codigo: 'A-020',
      total_lavagens: 5,
      intervalo_medio: 780,
      possui_anomalia: true,
    });
    expect(result?.historico_lavagens.map((wash) => wash.id)).toEqual([
      'wash_5',
      'wash_4',
      'wash_3',
      'wash_2',
      'wash_1',
    ]);
    expect(result?.historico_lavagens[0]).toMatchObject({
      id: 'wash_5',
      intervalo_desde_lavagem_anterior: 1680,
      fora_do_padrao: true,
    });
    expect(result?.historico_lavagens.at(-1)).toMatchObject({
      id: 'wash_1',
      intervalo_desde_lavagem_anterior: null,
      fora_do_padrao: true,
    });
  });

  it('does not mark anomaly when stencil has one wash in Manaus reserved hours', async () => {
    const result = await makeServiceWithStencil(makeStencil({
      washes: [makeWash('wash_1', '2026-05-10T15:30:00.000Z')],
    })).findOne('stencil_1');

    expect(result).toMatchObject({
      possui_anomalia: false,
    });
    expect(result?.historico_lavagens[0]).toMatchObject({
      id: 'wash_1',
      fora_do_padrao: false,
    });
  });

  it('marks anomaly when stencil wash happens outside Manaus reserved hours', async () => {
    const result = await makeServiceWithStencil(makeStencil({
      washes: [makeWash('wash_1', '2026-05-10T14:30:00.000Z')],
    })).findOne('stencil_1');

    expect(result).toMatchObject({
      possui_anomalia: true,
    });
    expect(result?.historico_lavagens[0]).toMatchObject({
      id: 'wash_1',
      fora_do_padrao: true,
    });
  });

  it('marks anomaly when stencil has more than one wash in the same Manaus day', async () => {
    const result = await makeServiceWithStencil(makeStencil({
      washes: [
        makeWash('wash_1', '2026-05-10T15:30:00.000Z'),
        makeWash('wash_2', '2026-05-10T20:30:00.000Z'),
      ],
    })).findOne('stencil_1');

    expect(result).toMatchObject({
      possui_anomalia: true,
    });
    expect(result?.historico_lavagens).toEqual([
      expect.objectContaining({ id: 'wash_2', fora_do_padrao: true }),
      expect.objectContaining({ id: 'wash_1', fora_do_padrao: true }),
    ]);
  });

  it('returns null metrics for stencil without washes', async () => {
    const result = await makeServiceWithStencil(makeStencil()).findOne('stencil_1');

    expect(result).toMatchObject({
      total_lavagens: 0,
      ultima_lavagem: null,
      intervalo_medio: null,
      possui_anomalia: false,
      historico_lavagens: [],
    });
  });

  it('returns null metrics for stencil with one wash', async () => {
    const result = await makeServiceWithStencil(makeStencil({
      washes: [makeWash('wash_1', '2026-05-10T15:30:00.000Z')],
    })).findOne('stencil_1');

    expect(result).toMatchObject({
      total_lavagens: 1,
      intervalo_medio: null,
      possui_anomalia: false,
    });
    expect(result?.historico_lavagens[0]).toMatchObject({
      intervalo_desde_lavagem_anterior: null,
      fora_do_padrao: false,
    });
  });

  it('returns null when stencil detail is not found', async () => {
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await expect(makeService(repository).findOne('missing')).resolves.toBeNull();
    await expect(makeService(repository).findDetailByStencilCode('missing')).resolves.toBeNull();
  });

  it('creates a stencil wash by stencil id', async () => {
    const stencil = makeStencil();
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(stencil),
    });
    const washRepository = makeWashRepository();

    await expect(makeService(repository, washRepository).createWash(stencil.id, {
      operator: 'Carlos Souza',
      createdAt: '2026-05-13T10:30:00.000Z',
    })).resolves.toMatchObject({
      id: 'stencil_wash_saved',
      stencilId: stencil.id,
      operator: 'Carlos Souza',
      createdAt: new Date('2026-05-13T10:30:00.000Z'),
    });
    expect(washRepository.create).toHaveBeenCalledWith({
      stencilId: stencil.id,
      operator: 'Carlos Souza',
      createdAt: new Date('2026-05-13T10:30:00.000Z'),
    });
  });

  it('creates a stencil wash by QR code', async () => {
    const stencil = makeStencil();
    const repository = makeRepository({
      findOneBy: jest.fn()
        .mockResolvedValueOnce(stencil)
        .mockResolvedValueOnce(stencil),
    });

    await expect(makeService(repository).createWashByStencilCode(stencil.stencilCode, {
      operator: 'Carlos Souza',
    })).resolves.toMatchObject({
      id: 'stencil_wash_saved',
      stencilId: stencil.id,
      operator: 'Carlos Souza',
    });
    expect(repository.findOneBy).toHaveBeenNthCalledWith(1, { stencilCode: stencil.stencilCode });
    expect(repository.findOneBy).toHaveBeenNthCalledWith(2, { id: stencil.id });
  });

  it('returns null when creating wash for missing stencil', async () => {
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(null),
    });

    await expect(makeService(repository).createWash('missing', {
      operator: 'Carlos Souza',
    })).resolves.toBeNull();
    await expect(makeService(repository).createWashByStencilCode('missing', {
      operator: 'Carlos Souza',
    })).resolves.toBeNull();
  });

  it('updates and removes existing stencil', async () => {
    const existing = makeStencil();
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(existing),
    });
    const service = makeService(repository);

    await expect(service.update(existing.id, { status: WashStatus.INACTIVE })).resolves.toMatchObject({
      status: WashStatus.INACTIVE,
    });
    await expect(service.remove(existing.id)).resolves.toBe(existing);
  });

  it('returns null when updating or removing missing stencil', async () => {
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(null),
    });
    const service = makeService(repository);

    await expect(service.update('missing', { status: WashStatus.INACTIVE })).resolves.toBeNull();
    await expect(service.remove('missing')).resolves.toBeNull();
  });

  it('lists available stencil lines', async () => {
    const getRawMany = jest.fn().mockResolvedValue([{ linha: 'Linha 1' }, { linha: 'Linha 2' }]);
    const orderBy = jest.fn().mockReturnValue({ getRawMany });
    const select = jest.fn().mockReturnValue({ orderBy });
    const repository = makeRepository({
      createQueryBuilder: jest.fn().mockReturnValue({ select }),
    });

    await expect(makeService(repository).findLines()).resolves.toEqual(['Linha 1', 'Linha 2']);
  });
});
