describe('Basic tests', () => {
  it('adds two numbers correctly', () => {
    expect(2 + 2).toBe(4);
  });

  it('concatenates two strings', () => {
    expect('hello' + ' world').toBe('hello world');
  });

  it('creates an array with specified length', () => {
    const arr = new Array(3).fill(0);
    expect(arr.length).toBe(3);
    expect(arr).toEqual([0, 0, 0]);
  });
});