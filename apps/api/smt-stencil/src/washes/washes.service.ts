import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { PlateWash } from '../plates/entities/plate-wash.entity';
import { StencilWash } from '../stencils/entities/stencil-wash.entity';

const MANAUS_TIME_ZONE = 'America/Manaus';
const MANAUS_UTC_OFFSET_HOURS = 4;

@Injectable()
export class WashesService {
  constructor(
    @InjectRepository(StencilWash)
    private readonly stencilWashRepository: Repository<StencilWash>,
    @InjectRepository(PlateWash)
    private readonly plateWashRepository: Repository<PlateWash>,
  ) {}

  async getDailySummary() {
    const { dayKey, startUtc, endUtc } = this.getManausDayRange(new Date());
    const range = Between(startUtc, endUtc);
    const [total_stencil, total_placas] = await Promise.all([
      this.stencilWashRepository.count({ where: { createdAt: range } }),
      this.plateWashRepository.count({ where: { createdAt: range } }),
    ]);

    return {
      data: dayKey,
      total_lavagens: total_stencil + total_placas,
      total_stencil,
      total_placas,
    };
  }

  private getManausDayRange(date: Date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: MANAUS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const value = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '';
    const year = Number(value('year'));
    const month = Number(value('month'));
    const day = Number(value('day'));
    const startUtc = new Date(
      Date.UTC(year, month - 1, day, MANAUS_UTC_OFFSET_HOURS, 0, 0, 0),
    );
    const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);

    return {
      dayKey: `${value('year')}-${value('month')}-${value('day')}`,
      startUtc,
      endUtc,
    };
  }
}
