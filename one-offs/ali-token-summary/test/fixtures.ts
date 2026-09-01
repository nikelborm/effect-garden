/**
 * A trimmed copy of a real `DescribeInstanceBill` response, keeping every
 * `InstanceID` shape the account actually produces, including the six-segment
 * `qwen3.8-flash` variant with its empty penultimate field.
 */
export const describeInstanceBill = {
  Code: 'Success',
  Message: 'Successful!',
  Success: true,
  Data: {
    BillingCycle: '2026-08',
    TotalCount: 13,
    Items: [
      item('1110389;ws-9h4296dos6ll46s2;glm-5.1;input_token;0', '0', '0', 0),
      item('1110389;ws-9h4296dos6ll46s2;glm-5.1;output_token;0', '0', '0', 0),
      item('1110389;ws-9h4296dos6ll46s2;glm-5.2;input_token;0', '0', '0', 0),
      item('1110389;ws-9h4296dos6ll46s2;glm-5.2;output_token;0', '0', '0', 0),
      item(
        '1110389;ws-9h4296dos6ll46s2;glm-5.2-fast-preview;input_token;0',
        '0.014',
        '0.0028',
        3.92e-5,
      ),
      item(
        '1110389;ws-9h4296dos6ll46s2;glm-5.2-fast-preview;output_token;0',
        '0.105',
        '0.0088',
        9.24e-4,
      ),
      item('1110389;ws-9h4296dos6ll46s2;kimi-k3;input_token;0', '0', '0', 0),
      item('1110389;ws-9h4296dos6ll46s2;kimi-k3;output_token;0', '0', '0', 0),
      item(
        '1110389;ws-9h4296dos6ll46s2;deepseek-v4-flash;input_token;0',
        '0',
        '0',
        0,
      ),
      item(
        '1110389;ws-9h4296dos6ll46s2;deepseek-v4-flash;output_token;0',
        '0',
        '0',
        0,
      ),
      // Note the extra empty segment before the trailing field.
      item(
        '1110389;ws-9h4296dos6ll46s2;qwen3.8-flash;input_token;;0',
        '0',
        '0',
        0,
      ),
      item(
        '1110389;ws-9h4296dos6ll46s2;qwen3.8-flash;output_token;;0',
        '0',
        '0',
        0,
      ),
      item(
        '1110389;ws-9h4296dos6ll46s2;qwen3.8-flash;input_token_cache;;0',
        '0',
        '0',
        0,
      ),
    ],
  },
}

/**
 * The two Marketplace lines for a resold third-party model. The InstanceID
 * names the model itself, `ZHIPU/GLM-5.3`, pluralises the token type, and
 * meters in `KTokens` rather than `1K tokens`.
 */
export const marketplaceItems = [
  marketplace(
    '6000000200348;ZHIPU/GLM-5.3;1110389;ws-9h4296dos6ll46s2;ap-southeast-1;international;input_tokens;intlcmgjllm10006104-KTokens-4',
    '0.072',
    '0.0014',
    1.008e-4,
  ),
  marketplace(
    '6000000200348;ZHIPU/GLM-5.3;1110389;ws-9h4296dos6ll46s2;ap-southeast-1;international;output_tokens;intlcmgjllm10006104-KTokens-5',
    '0.395',
    '0.0044',
    1.738e-3,
  ),
]

/** A line from some other product, whose InstanceID follows no convention. */
export const opaqueItem = {
  ...item('i-t4n8842xkq', '1', '0.0046', 4.6e-3),
  ProductCode: 'ecs',
  ProductName: 'Elastic Compute Service',
  BillingItem: 'Instance',
  UsageUnit: 'Hour',
}

function marketplace(
  instanceId: string,
  usage: string,
  listPrice: string,
  gross: number,
) {
  return {
    ...item(instanceId, usage, listPrice, gross),
    ProductCode: 'mpintl-mt9-dt26',
    ProductName: 'Third-Party Services in Marketplace',
    BillingItem: 'KTokens',
    UsageUnit: 'KTokens',
  }
}

function item(
  instanceId: string,
  usage: string,
  listPrice: string,
  gross: number,
) {
  return {
    InstanceID: instanceId,
    BillingItem: 'TextModelTokens',
    ProductCode: 'sfm',
    ProductName: 'Alibaba Cloud Model Studio',
    Currency: 'USD',
    Usage: usage,
    UsageUnit: '1K tokens',
    ListPrice: listPrice,
    PretaxGrossAmount: gross,
    // Sub-cent amounts survive at the line level; the round-down to zero
    // happens when the product total is assembled.
    PretaxAmount: gross,
  }
}
