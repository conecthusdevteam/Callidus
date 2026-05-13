import { Repository } from 'typeorm';
import { PlateWash } from '../plates/entities/plate-wash.entity';
import { StencilWash } from '../stencils/entities/stencil-wash.entity';
import { WashesService } from './washes.service';

jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

describe('WashesService', () => {
  function makeRepository(count: number) {
    return {
      count: jest.fn().mockResolvedValue(count),
    };
  }

  it('returns daily summary using stencil and plate wash counts', async () => {
    const stencilWashRepository = makeRepository(
      24,
    ) as unknown as Repository<StencilWash>;
    const plateWashRepository = makeRepository(
      12,
    ) as unknown as Repository<PlateWash>;

    await expect(
      new WashesService(
        stencilWashRepository,
        plateWashRepository,
      ).getDailySummary(),
    ).resolves.toMatchObject({
      total_lavagens: 36,
      total_stencil: 24,
      total_placas: 12,
    });
    expect(stencilWashRepository.count).toHaveBeenCalledWith({
      where: { createdAt: expect.any(Object) },
    });
    expect(plateWashRepository.count).toHaveBeenCalledWith({
      where: { createdAt: expect.any(Object) },
    });
  });
});
