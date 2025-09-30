import { cn, formatDate, generateSlug, truncateText, calculateReadTime } from '../utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('combines class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })

    it('merges Tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2') // Later class should override
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date)).toBe('January 15, 2024')
    })

    it('handles different date formats', () => {
      const date = new Date('2024-12-25')
      expect(formatDate(date)).toBe('December 25, 2024')
    })

    it('handles custom format options', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const options = { year: 'numeric' as const, month: 'short' as const }
      expect(formatDate(date, options)).toBe('Jan 2024')
    })
  })

  describe('generateSlug', () => {
    it('converts text to slug format', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
    })

    it('handles special characters', () => {
      expect(generateSlug('Hello, World! & More')).toBe('hello-world-more')
    })

    it('handles multiple spaces', () => {
      expect(generateSlug('Multiple   Spaces   Here')).toBe('multiple-spaces-here')
    })

    it('handles leading and trailing spaces', () => {
      expect(generateSlug('  Trimmed Text  ')).toBe('trimmed-text')
    })

    it('handles numbers', () => {
      expect(generateSlug('Article 123 Title')).toBe('article-123-title')
    })

    it('handles empty string', () => {
      expect(generateSlug('')).toBe('')
    })
  })

  describe('truncateText', () => {
    it('truncates text to specified length', () => {
      const text = 'This is a long text that should be truncated'
      expect(truncateText(text, 20)).toBe('This is a long text...')
    })

    it('does not truncate if text is shorter than limit', () => {
      const text = 'Short text'
      expect(truncateText(text, 20)).toBe('Short text')
    })

    it('handles custom suffix', () => {
      const text = 'This is a long text that should be truncated'
      expect(truncateText(text, 20, ' [more]')).toBe('This is a long text [more]')
    })

    it('handles empty text', () => {
      expect(truncateText('', 10)).toBe('')
    })

    it('handles zero length', () => {
      expect(truncateText('Some text', 0)).toBe('...')
    })
  })

  describe('calculateReadTime', () => {
    it('calculates read time for short text', () => {
      const text = 'This is a short text with about twenty words in it for testing purposes.'
      expect(calculateReadTime(text)).toBe(1) // Should be 1 minute minimum
    })

    it('calculates read time for longer text', () => {
      // Create text with approximately 400 words (should be ~2 minutes at 200 WPM)
      const words = Array(400).fill('word').join(' ')
      expect(calculateReadTime(words)).toBe(2)
    })

    it('calculates read time for very long text', () => {
      // Create text with approximately 1000 words (should be ~5 minutes at 200 WPM)
      const words = Array(1000).fill('word').join(' ')
      expect(calculateReadTime(words)).toBe(5)
    })

    it('handles empty text', () => {
      expect(calculateReadTime('')).toBe(1) // Minimum 1 minute
    })

    it('handles text with punctuation and special characters', () => {
      const text = 'Hello, world! This is a test. How are you? I am fine, thank you.'
      expect(calculateReadTime(text)).toBe(1)
    })
  })
})