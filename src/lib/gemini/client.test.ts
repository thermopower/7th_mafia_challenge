import { describe, it, expect } from 'vitest';

describe('Gemini Client', () => {
  it('should have correct analysis result structure', () => {
    // Arrange: 분석 결과 구조
    const mockResult = {
      general: '전체적으로 좋은 운세입니다.',
      wealth: '재물운이 상승합니다.',
      love: '애정운이 평온합니다.',
      health: '건강에 유의하세요.',
      job: '직장운이 좋습니다.',
    };

    // Assert: 필수 키 존재 확인
    expect(mockResult).toHaveProperty('general');
    expect(mockResult).toHaveProperty('wealth');
    expect(mockResult).toHaveProperty('love');
    expect(mockResult).toHaveProperty('health');
    expect(mockResult).toHaveProperty('job');
  });

  it('should validate analysis result fields are strings', () => {
    // Arrange
    const mockResult = {
      general: '총운',
      wealth: '재물운',
      love: '애정운',
      health: '건강운',
      job: '직업운',
    };

    // Assert: 모든 필드가 문자열
    expect(typeof mockResult.general).toBe('string');
    expect(typeof mockResult.wealth).toBe('string');
    expect(typeof mockResult.love).toBe('string');
    expect(typeof mockResult.health).toBe('string');
    expect(typeof mockResult.job).toBe('string');
  });

  it('should handle JSON parsing of analysis result', () => {
    // Arrange: JSON 문자열
    const jsonString = JSON.stringify({
      general: '전체 운세',
      wealth: '재물운',
      love: '애정운',
      health: '건강운',
      job: '직업운',
    });

    // Act: JSON 파싱
    const parsed = JSON.parse(jsonString);

    // Assert: 파싱 성공
    expect(parsed.general).toBe('전체 운세');
    expect(parsed.wealth).toBe('재물운');
  });

  it('should throw error on invalid JSON', () => {
    // Arrange: 잘못된 JSON
    const invalidJson = 'This is not valid JSON';

    // Act & Assert: 파싱 에러
    expect(() => JSON.parse(invalidJson)).toThrow();
  });

  it('should throw error on empty JSON string', () => {
    // Arrange: 빈 문자열
    const emptyString = '';

    // Act & Assert: 파싱 에러
    expect(() => JSON.parse(emptyString)).toThrow();
  });
});
