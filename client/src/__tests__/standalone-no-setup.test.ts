// Basic test without any dependencies
describe('Standalone test', () => {
  it('should perform basic calculations', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
    expect('hello'.length).toBe(5);
  });
});