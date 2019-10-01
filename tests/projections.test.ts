import { isOutdated } from "../lib/projections";
import { Resource } from "../lib/types";

describe("isOutdated()", () => {
  const timestamp = 0;
  const ttl = 30;

  test("returns true if current timestamp > original timestamp + ttl", () => {
    jest.spyOn(Date, "now").mockImplementationOnce(() => timestamp + ttl + 1);
    const x: Resource<number> = { meta: { timestamp, ttl, stale: false } };
    expect(isOutdated(x)).toBe(true);
  });

  test("returns false if current timestamp <= original timestamp + ttl", () => {
    jest.spyOn(Date, "now").mockImplementationOnce(() => timestamp + ttl);
    const x: Resource<number> = {
      meta: { timestamp: timestamp + ttl + 1, ttl, stale: false }
    };
    expect(isOutdated(x)).toBe(true);
  });
});
