import { describe, it, expect } from 'vitest';
import { calculateSaju, formatSajuData } from './calculate';

describe('Saju Calculate', () => {
  describe('calculateSaju', () => {
    it('should calculate saju data with valid birth date', () => {
      // Arrange
      const birthDate = new Date('1990-01-01');
      const birthTime = '10:00';

      // Act: 사주 계산
      const result = calculateSaju(birthDate, birthTime, false);

      // Assert: 구조 검증
      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('day');
      expect(result).toHaveProperty('hour');
      expect(result).toHaveProperty('sipsin');
      expect(result).toHaveProperty('daeun');

      expect(result.year).toHaveProperty('cheongan');
      expect(result.year).toHaveProperty('jiji');
      expect(result.month).toHaveProperty('cheongan');
      expect(result.month).toHaveProperty('jiji');
      expect(result.day).toHaveProperty('cheongan');
      expect(result.day).toHaveProperty('jiji');
      expect(result.hour).toHaveProperty('cheongan');
      expect(result.hour).toHaveProperty('jiji');

      expect(Array.isArray(result.sipsin)).toBe(true);
      expect(Array.isArray(result.daeun)).toBe(true);
    });

    it('should handle birth date without time', () => {
      // Arrange
      const birthDate = new Date('1995-05-15');

      // Act: 시간 없이 계산
      const result = calculateSaju(birthDate);

      // Assert: 결과 반환 확인
      expect(result).toBeDefined();
      expect(result.year.cheongan).toBeTruthy();
      expect(result.month.cheongan).toBeTruthy();
    });

    it('should handle lunar calendar flag', () => {
      // Arrange
      const birthDate = new Date('1990-01-01');
      const birthTime = '12:00';

      // Act: 음력 플래그 사용
      const result = calculateSaju(birthDate, birthTime, true);

      // Assert: 음력 계산 결과 (현재는 더미 데이터)
      expect(result).toBeDefined();
      expect(result.year).toBeDefined();
    });

    it('should return consistent structure for different dates', () => {
      // Arrange
      const dates = [
        new Date('1980-03-15'),
        new Date('1990-07-20'),
        new Date('2000-11-05'),
      ];

      // Act: 여러 날짜로 계산
      const results = dates.map((date) => calculateSaju(date));

      // Assert: 모든 결과가 동일한 구조
      results.forEach((result) => {
        expect(result).toHaveProperty('year');
        expect(result).toHaveProperty('month');
        expect(result).toHaveProperty('day');
        expect(result).toHaveProperty('hour');
        expect(result.sipsin).toHaveLength(4);
        expect(result.daeun).toHaveLength(3);
      });
    });

    it('should handle early morning time (자시)', () => {
      // Arrange
      const birthDate = new Date('1990-01-01');
      const birthTime = '00:30'; // 자시

      // Act
      const result = calculateSaju(birthDate, birthTime);

      // Assert: 자시 처리 확인
      expect(result).toBeDefined();
      expect(result.hour).toBeDefined();
    });
  });

  describe('formatSajuData', () => {
    it('should format saju data to string', () => {
      // Arrange: 사주 데이터
      const sajuData = {
        year: { cheongan: '갑', jiji: '자' },
        month: { cheongan: '병', jiji: '인' },
        day: { cheongan: '무', jiji: '진' },
        hour: { cheongan: '경', jiji: '오' },
        sipsin: ['편관', '정재', '식신', '비견'],
        daeun: ['신유', '임술', '계해'],
      };

      // Act: 포맷팅
      const formatted = formatSajuData(sajuData);

      // Assert: 포맷 검증
      expect(formatted).toContain('년주: 갑자');
      expect(formatted).toContain('월주: 병인');
      expect(formatted).toContain('일주: 무진');
      expect(formatted).toContain('시주: 경오');
      expect(formatted).toContain('십신: 편관, 정재, 식신, 비견');
      expect(formatted).toContain('대운: 신유, 임술, 계해');
    });

    it('should format saju data consistently', () => {
      // Arrange
      const birthDate = new Date('1990-01-01');
      const sajuData = calculateSaju(birthDate);

      // Act: 포맷팅
      const formatted = formatSajuData(sajuData);

      // Assert: 필수 키워드 포함
      expect(formatted).toContain('년주:');
      expect(formatted).toContain('월주:');
      expect(formatted).toContain('일주:');
      expect(formatted).toContain('시주:');
      expect(formatted).toContain('십신:');
      expect(formatted).toContain('대운:');
    });
  });
});
