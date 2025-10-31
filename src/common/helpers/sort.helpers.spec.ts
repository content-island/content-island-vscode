import { sortByString } from './sort.helpers.js';

describe('sortByString', () => {
  it('should return empty array when it feeds empty array', () => {
    // Arrange
    const array = [];

    // Act
    const result = array.sort(sortByString);

    // Assert
    expect(result).toEqual([]);
  });

  it('should return sorted array when it feeds array with texts', () => {
    // Arrange
    const array = ['a text', 'c text', 'b text', '1 text'];

    // Act
    const result = array.sort(sortByString);

    // Assert
    expect(result).toEqual(['1 text', 'a text', 'b text', 'c text']);
  });

  it('should return sorted array when it feeds array with texts and numbers', () => {
    // Arrange
    const array = ['a text', 'a text 3 extra', 'a text 2', 'a text 23', 'a text 1 extra'];

    // Act
    const result = array.sort(sortByString);

    // Assert
    expect(result).toEqual(['a text', 'a text 1 extra', 'a text 2', 'a text 3 extra', 'a text 23']);
  });
});
