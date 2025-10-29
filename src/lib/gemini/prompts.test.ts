import { describe, it, expect } from 'vitest';
import { createAnalysisPrompt } from './prompts';
import type { SajuData } from '@/types';

describe('Gemini Prompts', () => {
  const mockSajuData: SajuData = {
    year: { cheongan: '갑', jiji: '자' },
    month: { cheongan: '병', jiji: '인' },
    day: { cheongan: '무', jiji: '진' },
    hour: { cheongan: '경', jiji: '오' },
    sipsin: ['편관', '정재', '식신', '비견'],
    daeun: ['신유', '임술', '계해'],
  };

  it('should create valid prompt for male monthly analysis', () => {
    // Act: 프롬프트 생성
    const prompt = createAnalysisPrompt(
      '홍길동',
      'male',
      mockSajuData,
      'monthly'
    );

    // Assert: 필수 정보 포함 확인
    expect(prompt).toContain('홍길동');
    expect(prompt).toContain('남성');
    expect(prompt).toContain('월간 운세');
    expect(prompt).toContain('갑자');
    expect(prompt).toContain('병인');
    expect(prompt).toContain('무진');
    expect(prompt).toContain('경오');
    expect(prompt).toContain('편관, 정재, 식신, 비견');
    expect(prompt).toContain('신유, 임술, 계해');
    expect(prompt).toContain('general');
    expect(prompt).toContain('wealth');
    expect(prompt).toContain('love');
    expect(prompt).toContain('health');
    expect(prompt).toContain('job');
  });

  it('should create valid prompt for female yearly analysis', () => {
    // Act: 프롬프트 생성
    const prompt = createAnalysisPrompt(
      '김영희',
      'female',
      mockSajuData,
      'yearly'
    );

    // Assert: 여성 및 신년 운세 확인
    expect(prompt).toContain('김영희');
    expect(prompt).toContain('여성');
    expect(prompt).toContain('신년 운세');
  });

  it('should create valid prompt for lifetime analysis', () => {
    // Act: 프롬프트 생성
    const prompt = createAnalysisPrompt(
      '박철수',
      'male',
      mockSajuData,
      'lifetime'
    );

    // Assert: 평생 운세 확인
    expect(prompt).toContain('박철수');
    expect(prompt).toContain('평생 운세');
  });

  it('should include JSON instruction in prompt', () => {
    // Act: 프롬프트 생성
    const prompt = createAnalysisPrompt(
      '이민수',
      'male',
      mockSajuData,
      'monthly'
    );

    // Assert: JSON 지시사항 포함
    expect(prompt).toContain('JSON 형식');
    expect(prompt).toContain('200자 이상');
  });

  it('should format all saju pillars correctly', () => {
    // Act: 프롬프트 생성
    const prompt = createAnalysisPrompt(
      '최지혜',
      'female',
      mockSajuData,
      'yearly'
    );

    // Assert: 사주팔자 형식 검증
    expect(prompt).toMatch(/년주:\s*갑자/);
    expect(prompt).toMatch(/월주:\s*병인/);
    expect(prompt).toMatch(/일주:\s*무진/);
    expect(prompt).toMatch(/시주:\s*경오/);
  });
});
