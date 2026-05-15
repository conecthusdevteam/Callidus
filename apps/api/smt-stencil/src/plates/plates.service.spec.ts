import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PlateWash } from './entities/plate-wash.entity';
import { Plate } from './entities/plate.entity';
import { PlatesService } from './plates.service';

jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

describe('PlatesService', () => {
  function makeRepository(
    overrides: Partial<Record<keyof Repository<Plate>, jest.Mock>> = {},
  ) {
    return {
      create: jest.fn((dto) => dto),
      save: jest.fn(async (entity) => ({ id: 'plate_saved', ...entity })),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      merge: jest.fn((entity, dto) => Object.assign(entity, dto)),
      remove: jest.fn(async (entity) => entity),
      ...overrides,
    } as unknown as jest.Mocked<Repository<Plate>>;
  }

  function makeWashRepository(
    overrides: Partial<Record<keyof Repository<PlateWash>, jest.Mock>> = {},
  ) {
    return {
      create: jest.fn((dto) => dto),
      save: jest.fn(async (entity) => ({ id: 'plate_wash_saved', ...entity })),
      ...overrides,
    } as unknown as jest.Mocked<Repository<PlateWash>>;
  }

  function makeService(
    repository: jest.Mocked<Repository<Plate>>,
    washRepository = makeWashRepository(),
  ) {
    return new PlatesService(repository, washRepository);
  }

  function makeWash(id: string, createdAt: string): PlateWash {
    return {
      id,
      operator: 'Maria Santos',
      shift: 1,
      phase: 2,
      createdAt: new Date(createdAt),
    } as PlateWash;
  }

  function makePlate(overrides: Partial<Plate> = {}): Plate {
    return {
      id: 'plate_1',
      plateModel: 'PCB-1000',
      serialNumber: 'PCB-1000-000001',
      blankId: 'BLANK-1001',
      lineName: 'Line 1',
      plateManufacturerId: 'MNF-101',
      country: 'Brasil',
      thickness: 0.09,
      addressing: '101',
      createdAt: new Date('2026-05-10T00:00:00.000Z'),
      updatedAt: new Date('2026-05-10T00:00:00.000Z'),
      washes: [],
      ...overrides,
    } as Plate;
  }

  it('creates a plate when model is unique', async () => {
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(null),
    });

    const dto = {
      plateModel: 'PCB-1000',
      serialNumber: 'PCB-1000-000001',
      blankId: 'BLANK-1001',
      lineName: 'Line 1',
    };

    await expect(makeService(repository).create(dto)).resolves.toMatchObject({
      id: 'plate_saved',
      plateModel: 'PCB-1000',
    });
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(dto);
  });

  it('throws conflict when plate model already exists', async () => {
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(makePlate()),
    });

    await expect(
      makeService(repository).create({
        plateModel: 'PCB-1000',
        serialNumber: 'PCB-1000-000001',
        blankId: 'BLANK-1001',
        lineName: 'Line 1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('lists plate summaries filtered by all supported fields', async () => {
    const repository = makeRepository({
      find: jest.fn().mockResolvedValue([
        makePlate({
          washes: [
            makeWash('wash_1', '2026-05-10T00:00:00.000Z'),
            makeWash('wash_2', '2026-05-10T08:00:00.000Z'),
          ],
        }),
      ]),
    });

    const result = await makeService(repository).findAll({
      plate_model: 'PCB',
      blank_id: 'BLANK',
      serial: '000001',
      line: 'Line 1',
    });

    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          plateModel: expect.any(Object),
          blankId: expect.any(Object),
          serialNumber: expect.any(Object),
          lineName: 'Line 1',
        }),
        relations: { washes: true },
        order: { createdAt: 'DESC' },
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        plate_model: 'PCB-1000',
        serial: 'PCB-1000-000001',
      total_washes: 2,
        last_wash: new Date('2026-05-10T08:00:00.000Z'),
        last_wash_details: expect.objectContaining({
          id: 'wash_2',
          operator: 'Maria Santos',
        }),
      }),
    ]);
  });

  it('returns paginated plate summaries when page or limit is provided', async () => {
    const repository = makeRepository({
      find: jest
        .fn()
        .mockResolvedValue([
          makePlate({ id: 'plate_1' }),
          makePlate({ id: 'plate_2' }),
        ]),
    });

    await expect(
      makeService(repository).findAll({ page: 1, limit: 1 }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 'plate_1' })],
      page: 1,
      limit: 1,
      total: 2,
      total_pages: 2,
    });
  });

  it('returns plate detail with history ordered by newest wash', async () => {
    const plate = makePlate({
      washes: [
        makeWash('wash_1', '2026-05-10T00:00:00.000Z'),
        makeWash('wash_2', '2026-05-10T08:00:00.000Z'),
        makeWash('wash_3', '2026-05-10T16:00:00.000Z'),
      ],
    });
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(plate),
    });

    const result = await makeService(repository).findOne(plate.id);

    expect(result).toMatchObject({
      id: 'plate_1',
      total_washes: 3,
      last_wash: new Date('2026-05-10T16:00:00.000Z'),
    });
    expect(result?.washes_history.map((wash) => wash.id)).toEqual([
      'wash_3',
      'wash_2',
      'wash_1',
    ]);
  });

  it('returns recent plate washes paginated and ordered by newest wash', async () => {
    const repository = makeRepository({
      find: jest.fn().mockResolvedValue([
        makePlate({
          washes: [
            makeWash('wash_1', '2026-05-10T00:00:00.000Z'),
            makeWash('wash_2', '2026-05-10T08:00:00.000Z'),
          ],
        }),
      ]),
    });

    await expect(
      makeService(repository).findRecentWashes({ page: 1, limit: 10 }),
    ).resolves.toMatchObject({
      items: [
        expect.objectContaining({
          id: 'wash_2',
          plate_id: 'plate_1',
          plate_model: 'PCB-1000',
          serial: 'PCB-1000-000001',
          blank_id: 'BLANK-1001',
        }),
        expect.objectContaining({ id: 'wash_1' }),
      ],
      page: 1,
      limit: 10,
      total: 2,
      total_pages: 1,
    });
  });

  it('returns empty history for plate without washes', async () => {
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(makePlate()),
    });

    await expect(
      makeService(repository).findOne('plate_1'),
    ).resolves.toMatchObject({
      total_washes: 0,
      last_wash: null,
      washes_history: [],
    });
  });

  it('returns null when plate detail is not found', async () => {
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await expect(
      makeService(repository).findOne('missing'),
    ).resolves.toBeNull();
  });

  it('creates a plate wash by plate id', async () => {
    const plate = makePlate();
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(plate),
    });
    const washRepository = makeWashRepository();

    await expect(
      makeService(repository, washRepository).createWash(plate.id, {
        operator: 'Maria Santos',
        shift: 2,
        phase: 1,
      }),
    ).resolves.toMatchObject({
      id: 'plate_wash_saved',
      plateId: plate.id,
      operator: 'Maria Santos',
      shift: 2,
      phase: 1,
    });
    expect(washRepository.create).toHaveBeenCalledWith({
      plateId: plate.id,
      operator: 'Maria Santos',
      shift: 2,
      phase: 1,
    });
  });

  it('returns null when creating wash for missing plate', async () => {
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(null),
    });

    await expect(
      makeService(repository).createWash('missing', {
        operator: 'Maria Santos',
        shift: 2,
        phase: 1,
      }),
    ).resolves.toBeNull();
  });

  it('updates and removes existing plate', async () => {
    const existing = makePlate();
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(existing),
    });
    const service = makeService(repository);

    await expect(
      service.update(existing.id, { lineName: 'Line 2' }),
    ).resolves.toMatchObject({
      lineName: 'Line 2',
    });
    await expect(service.remove(existing.id)).resolves.toBe(existing);
  });

  it('returns null when updating or removing missing plate', async () => {
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(null),
    });
    const service = makeService(repository);

    await expect(
      service.update('missing', { lineName: 'Line 2' }),
    ).resolves.toBeNull();
    await expect(service.remove('missing')).resolves.toBeNull();
  });
});
