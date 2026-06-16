import { ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Stencil, WashStatus } from './entities/stencil.entity';
import { StencilWash } from './entities/stencil-wash.entity';
import { StencilsService } from './stencils.service';

jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

describe('StencilsService', () => {
  function makeRepository(
    overrides: Partial<Record<keyof Repository<Stencil>, jest.Mock>> = {},
  ) {
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

  function makeWashRepository(
    overrides: Partial<Record<keyof Repository<StencilWash>, jest.Mock>> = {},
  ) {
    return {
      create: jest.fn((dto) => dto),
      save: jest.fn(async (entity) => ({
        id: 'stencil_wash_saved',
        ...entity,
      })),
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
      lineName: 'Line 1',
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
      lineName: 'Line 1',
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

    await expect(
      makeService(repository).create({
        stencilCode: 'A-019',
        manufactureId: 'MNF-001',
        country: 'Brasil',
        thickness: 0.12,
        addressing: 19,
        lineName: 'Line 1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
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

    const result = await makeService(repository).findAll({
      stencilCode: 'A-0',
      lineName: 'Line 1',
    });

    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          stencilCode: expect.any(Object),
          lineName: 'Line 1',
        }),
        relations: { washes: true },
        order: { createdAt: 'DESC' },
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        stencilCode: 'A-019',
        total_washes: 2,
        mid_range: 480,
        anomaly: true,
        last_wash_details: expect.objectContaining({
          id: 'wash_2',
          operator: 'Carlos Souza',
        }),
      }),
    ]);
  });

  it('returns paginated stencil summaries when page or limit is provided', async () => {
    const repository = makeRepository({
      find: jest
        .fn()
        .mockResolvedValue([
          makeStencil({ id: 'stencil_1' }),
          makeStencil({ id: 'stencil_2' }),
        ]),
    });

    await expect(
      makeService(repository).findAll({ page: 1, limit: 1 }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 'stencil_1' })],
      page: 1,
      limit: 1,
      total: 2,
      total_pages: 2,
    });
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
      stencilCode: 'A-020',
      total_washes: 5,
      mid_range: 780,
      anomaly: true,
    });
    expect(result?.washes_history.map((wash) => wash.id)).toEqual([
      'wash_5',
      'wash_4',
      'wash_3',
      'wash_2',
      'wash_1',
    ]);
    expect(result?.washes_history[0]).toMatchObject({
      id: 'wash_5',
      previous_wash_interval: 1680,
      non_standard: true,
    });
    expect(result?.washes_history.at(-1)).toMatchObject({
      id: 'wash_1',
      previous_wash_interval: null,
      non_standard: true,
    });
  });

  it('loads washes when retrieving stencil details', async () => {
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(makeStencil()),
    });

    await makeService(repository).findOne('stencil_1');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'stencil_1' },
      relations: { washes: true },
    });
  });

  it('returns 30-day analytics with planned, anomalous and multiple classifications', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-26T12:00:00.000Z'));

    const washes = [
      makeWash('planned_1', '2026-05-23T15:30:00.000Z'),
      makeWash('anomalous_1', '2026-05-24T17:00:00.000Z'),
      makeWash('multiple_1', '2026-05-25T15:15:00.000Z'),
      makeWash('multiple_2', '2026-05-25T18:00:00.000Z'),
    ];
    const stencil = makeStencil({ washes });
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(stencil),
    });
    const washRepository = makeWashRepository({
      find: jest.fn().mockResolvedValueOnce(washes).mockResolvedValueOnce([]),
    });

    const result = await makeService(
      repository,
      washRepository,
    ).findWashAnalytics(stencil.id);

    expect(result).toMatchObject({
      period: { days: 30 },
      counts: {
        planned: 1,
        anomalous: 1,
        multiple: 2,
        total: 4,
      },
    });
    expect(result?.time_points.map((point) => point.category)).toEqual([
      'planned',
      'anomalous',
      'multiple',
      'multiple',
    ]);
    expect(result?.interval_bars.at(-1)).toMatchObject({
      day_label: '25/05',
      interval_minutes: 165,
      category: 'multiple',
    });

    jest.useRealTimers();
  });

  it.each([7, 15, 30, 60, 90])(
    'accepts the %i-day analytics period',
    async (days) => {
      jest.useFakeTimers().setSystemTime(new Date('2026-05-26T12:00:00.000Z'));
      const stencil = makeStencil();
      const repository = makeRepository({
        findOne: jest.fn().mockResolvedValue(stencil),
      });
      const washRepository = makeWashRepository({
        find: jest.fn().mockResolvedValue([]),
      });

      const result = await makeService(
        repository,
        washRepository,
      ).findWashAnalytics(stencil.id, days);

      expect(result?.period.days).toBe(days);
      jest.useRealTimers();
    },
  );

  it('uses the shortest same-day interval when a day has multiple washes', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));
    const washes = [
      makeWash('previous_day', '2026-05-10T22:00:00.000Z'),
      makeWash('day_09', '2026-05-11T13:00:00.000Z'),
      makeWash('day_16', '2026-05-11T20:00:00.000Z'),
    ];
    const stencil = makeStencil({ washes });
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(stencil),
    });
    const washRepository = makeWashRepository({
      find: jest.fn().mockResolvedValueOnce(washes).mockResolvedValueOnce([]),
    });

    const result = await makeService(
      repository,
      washRepository,
    ).findWashAnalytics(stencil.id, 7);
    const multipleDay = result?.interval_bars.find(
      (bar) => bar.day_label === '11/05',
    );

    expect(multipleDay).toMatchObject({
      interval_minutes: 7 * 60,
      wash_ids: ['day_09', 'day_16'],
    });
    expect(
      result?.interval_bars.find((bar) => bar.day_label === '10/05'),
    ).toMatchObject({
      interval_minutes: null,
      wash_ids: ['previous_day'],
    });
    jest.useRealTimers();
  });

  it('keeps imported washes even when they predate the asset record', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));
    const stencil = makeStencil({
      createdAt: new Date('2026-05-11T00:00:00.000Z'),
    });
    const washRepository = makeWashRepository({
      find: jest
        .fn()
        .mockResolvedValueOnce([
          makeWash('imported_earlier_wash', '2026-05-10T20:00:00.000Z'),
          makeWash('later_wash', '2026-05-11T13:00:00.000Z'),
        ])
        .mockResolvedValueOnce([]),
    });

    const result = await makeService(
      makeRepository({ findOne: jest.fn().mockResolvedValue(stencil) }),
      washRepository,
    ).findWashAnalytics(stencil.id, 7);

    expect(result?.time_points.map((wash) => wash.id)).toEqual([
      'imported_earlier_wash',
      'later_wash',
    ]);
    expect(result?.interval_bars.at(0)).toMatchObject({
      interval_minutes: null,
      wash_ids: ['imported_earlier_wash'],
    });
    jest.useRealTimers();
  });

  it('does not mark anomaly when stencil has one wash in Manaus reserved hours', async () => {
    const result = await makeServiceWithStencil(
      makeStencil({
        washes: [makeWash('wash_1', '2026-05-10T15:30:00.000Z')],
      }),
    ).findOne('stencil_1');

    expect(result).toMatchObject({
      anomaly: false,
    });
    expect(result?.washes_history[0]).toMatchObject({
      id: 'wash_1',
      non_standard: false,
    });
  });

  it('marks anomaly when stencil wash happens outside Manaus reserved hours', async () => {
    const result = await makeServiceWithStencil(
      makeStencil({
        washes: [makeWash('wash_1', '2026-05-10T14:30:00.000Z')],
      }),
    ).findOne('stencil_1');

    expect(result).toMatchObject({
      anomaly: true,
    });
    expect(result?.washes_history[0]).toMatchObject({
      id: 'wash_1',
      non_standard: true,
    });
  });

  it('marks anomaly when stencil has more than one wash in the same Manaus day', async () => {
    const result = await makeServiceWithStencil(
      makeStencil({
        washes: [
          makeWash('wash_1', '2026-05-10T15:30:00.000Z'),
          makeWash('wash_2', '2026-05-10T20:30:00.000Z'),
        ],
      }),
    ).findOne('stencil_1');

    expect(result).toMatchObject({
      anomaly: true,
    });
    expect(result?.washes_history).toEqual([
      expect.objectContaining({ id: 'wash_2', non_standard: true }),
      expect.objectContaining({ id: 'wash_1', non_standard: true }),
    ]);
  });

  it('returns null metrics for stencil without washes', async () => {
    const result =
      await makeServiceWithStencil(makeStencil()).findOne('stencil_1');

    expect(result).toMatchObject({
      total_washes: 0,
      last_wash: null,
      mid_range: null,
      anomaly: false,
      washes_history: [],
    });
  });

  it('filters and paginates recent washes in the database query', async () => {
    const queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(12),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([
        {
          id: 'wash_1',
          stencil_id: 'stencil_1',
          created_at: new Date('2026-05-10T20:30:00.000Z'),
          stencil_code: 'A-019',
          addressing: '19',
          manufacture_id: 'MNF-001',
          country: 'Brasil',
          status: 'active',
          line_name: 'Line 1',
          operator: 'Carlos Souza',
          previous_wash_interval: 300,
          occurrence: 'multiple',
        },
      ]),
    };
    const washRepository = makeWashRepository({
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    });

    const result = await makeService(
      makeRepository(),
      washRepository,
    ).findRecentWashes({
      page: 2,
      limit: 5,
      attentionOnly: true,
      stencilCode: 'A-019',
      operator: 'Carlos',
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'stencil.stencilCode LIKE :stencilCode',
      { stencilCode: '%A-019%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'wash.operator LIKE :operator',
      { operator: '%Carlos%' },
    );
    expect(queryBuilder.offset).toHaveBeenCalledWith(5);
    expect(queryBuilder.limit).toHaveBeenCalledWith(5);
    expect(result).toMatchObject({
      items: [
        expect.objectContaining({
          id: 'wash_1',
          addressing: '019',
          occurrence: 'multiple',
          non_standard: true,
        }),
      ],
      page: 2,
      limit: 5,
      total: 12,
      total_pages: 3,
    });
  });

  it('returns null metrics for stencil with one wash', async () => {
    const result = await makeServiceWithStencil(
      makeStencil({
        washes: [makeWash('wash_1', '2026-05-10T15:30:00.000Z')],
      }),
    ).findOne('stencil_1');

    expect(result).toMatchObject({
      total_washes: 1,
      mid_range: null,
      anomaly: false,
    });
    expect(result?.washes_history[0]).toMatchObject({
      previous_wash_interval: null,
      non_standard: false,
    });
  });

  it('returns null when stencil detail is not found', async () => {
    const repository = makeRepository({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await expect(
      makeService(repository).findOne('missing'),
    ).resolves.toBeNull();
    await expect(
      makeService(repository).findDetailByStencilCode('missing'),
    ).resolves.toBeNull();
  });

  it('creates a stencil wash by stencil id', async () => {
    const stencil = makeStencil();
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(stencil),
    });
    const washRepository = makeWashRepository();

    await expect(
      makeService(repository, washRepository).createWash(stencil.id, {
        operator: 'Carlos Souza',
        createdAt: '2026-05-13T10:30:00.000Z',
      }),
    ).resolves.toMatchObject({
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
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce(stencil)
        .mockResolvedValueOnce(stencil),
    });

    await expect(
      makeService(repository).createWashByStencilCode(stencil.stencilCode, {
        operator: 'Carlos Souza',
      }),
    ).resolves.toMatchObject({
      id: 'stencil_wash_saved',
      stencilId: stencil.id,
      operator: 'Carlos Souza',
    });
    expect(repository.findOneBy).toHaveBeenNthCalledWith(1, {
      stencilCode: stencil.stencilCode,
    });
    expect(repository.findOneBy).toHaveBeenNthCalledWith(2, { id: stencil.id });
  });

  it('rejects new washes for inactive stencils', async () => {
    const stencil = makeStencil({ status: WashStatus.INACTIVE });
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(stencil),
    });
    const washRepository = makeWashRepository();
    const service = makeService(repository, washRepository);

    await expect(
      service.createWash(stencil.id, { operator: 'Carlos Souza' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(washRepository.create).not.toHaveBeenCalled();
    expect(washRepository.save).not.toHaveBeenCalled();
  });

  it('rejects new washes by QR code for inactive stencils', async () => {
    const stencil = makeStencil({ status: WashStatus.INACTIVE });
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(stencil),
    });
    const washRepository = makeWashRepository();
    const service = makeService(repository, washRepository);

    await expect(
      service.createWashByStencilCode(stencil.stencilCode, {
        operator: 'Carlos Souza',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(washRepository.create).not.toHaveBeenCalled();
    expect(washRepository.save).not.toHaveBeenCalled();
  });

  it('returns null when creating wash for missing stencil', async () => {
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(null),
    });

    await expect(
      makeService(repository).createWash('missing', {
        operator: 'Carlos Souza',
      }),
    ).resolves.toBeNull();
    await expect(
      makeService(repository).createWashByStencilCode('missing', {
        operator: 'Carlos Souza',
      }),
    ).resolves.toBeNull();
  });

  it('updates and removes existing stencil', async () => {
    const existing = makeStencil();
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(existing),
    });
    const service = makeService(repository);

    await expect(
      service.update(existing.id, { status: WashStatus.INACTIVE }),
    ).resolves.toMatchObject({
      status: WashStatus.INACTIVE,
    });
    await expect(service.remove(existing.id)).resolves.toBe(existing);
  });

  it('returns null when updating or removing missing stencil', async () => {
    const repository = makeRepository({
      findOneBy: jest.fn().mockResolvedValue(null),
    });
    const service = makeService(repository);

    await expect(
      service.update('missing', { status: WashStatus.INACTIVE }),
    ).resolves.toBeNull();
    await expect(service.remove('missing')).resolves.toBeNull();
  });

  it('lists available stencil lines', async () => {
    const getRawMany = jest
      .fn()
      .mockResolvedValue([{ lineName: 'Line 1' }, { lineName: 'Line 2' }]);
    const orderBy = jest.fn().mockReturnValue({ getRawMany });
    const select = jest.fn().mockReturnValue({ orderBy });
    const repository = makeRepository({
      createQueryBuilder: jest.fn().mockReturnValue({ select }),
    });

    await expect(makeService(repository).findLines()).resolves.toEqual([
      'Line 1',
      'Line 2',
    ]);
  });
});
