import { processHaltData } from "../utils/haltDataUtils";

describe("haltDataUtils", () => {
  it("should detect same-day resumption when resumptionTime is compact backend format", () => {
    const data = [
      {
        haltId: "H1",
        state: "ACTIVE_TRADING",
        resumptionTime: "20260506-12:30:00.000",
      },
    ];

    const result = processHaltData(data);

    expect(result.liftedData).toHaveLength(1);
    expect(result.liftedData[0].haltId).toBe("H1");
  });
});
