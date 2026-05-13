import { Repository } from 'typeorm';
import { Plate } from '../plates/entities/plate.entity';
import { Stencil } from '../stencils/entities/stencil.entity';
import { LinesService } from './lines.service';

jest.mock('nanoid', () => ({
  nanoid: () => 'test-id',
}));

describe('LinesService', () => {
  function makeRepository(lines: string[]) {
    const getRawMany = jest.fn().mockResolvedValue(lines.map((linha) => ({ linha })));

    return {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          getRawMany,
        }),
      }),
    };
  }

  it('returns unique sorted lines from stencils and plates', async () => {
    const stencilRepository = makeRepository(['Linha 2', 'Linha 1']) as unknown as Repository<Stencil>;
    const plateRepository = makeRepository(['Linha 1', 'Linha 3']) as unknown as Repository<Plate>;

    await expect(new LinesService(stencilRepository, plateRepository).findAll()).resolves.toEqual([
      'Linha 1',
      'Linha 2',
      'Linha 3',
    ]);
  });
});
