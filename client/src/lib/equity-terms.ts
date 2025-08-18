export interface EquityTerm {
  term: string;
  definition: string;
  example?: string;
}

export const equityTerms: Record<string, EquityTerm> = {
  // Basic Equity Terms
  "common_stock": {
    term: "Common Stock",
    definition: "Basic ownership shares in a company that typically come with voting rights and represent a claim on the company's assets and earnings.",
    example: "Founders and employees usually receive common stock."
  },
  
  "preferred_stock": {
    term: "Preferred Stock",
    definition: "A class of ownership that has a higher claim on assets and earnings than common stock. Preferred shareholders usually get paid dividends before common shareholders.",
    example: "Investors in funding rounds typically receive preferred shares with liquidation preferences."
  },
  
  "option_pool": {
    term: "Option Pool",
    definition: "A portion of company equity set aside to grant stock options to employees, advisors, and other service providers. Usually represents 10-20% of total equity.",
    example: "A company might create a 15% option pool before a Series A to incentivize key hires."
  },
  
  // Valuation Terms
  "pre_money_valuation": {
    term: "Pre-Money Valuation",
    definition: "The value of a company before receiving new investment. Used to determine how much equity investors will receive.",
    example: "With a $10M pre-money valuation and $2M investment, investors get 20% equity."
  },
  
  "post_money_valuation": {
    term: "Post-Money Valuation",
    definition: "The value of a company after receiving new investment (pre-money + investment amount).",
    example: "$10M pre-money + $2M investment = $12M post-money valuation."
  },
  
  "price_per_share": {
    term: "Price Per Share",
    definition: "The amount paid for each share of stock, calculated by dividing the pre-money valuation by the number of existing shares.",
    example: "$10M valuation ÷ 1M shares = $10 per share."
  },
  
  // Dilution & Ownership
  "dilution": {
    term: "Dilution",
    definition: "The reduction in ownership percentage that occurs when new shares are issued, making existing shares represent a smaller portion of the company.",
    example: "If you own 10% and the company issues new shares for investment, your ownership might decrease to 8%."
  },
  
  "fully_diluted": {
    term: "Fully Diluted",
    definition: "The total number of shares that would be outstanding if all convertible securities (options, warrants, convertible notes) were exercised or converted.",
    example: "1M common shares + 200K options + 50K warrants = 1.25M fully diluted shares."
  },
  
  "anti_dilution": {
    term: "Anti-Dilution Protection",
    definition: "Provisions that protect investors from dilution in down rounds by adjusting their conversion price or issuing additional shares.",
    example: "Weighted average anti-dilution adjusts the conversion price based on the new round price."
  },
  
  // Investment Terms
  "liquidation_preference": {
    term: "Liquidation Preference",
    definition: "The right of preferred shareholders to receive their investment back before common shareholders in a liquidation event.",
    example: "1x liquidation preference means investors get their money back first, then remaining proceeds are distributed."
  },
  
  "participation_rights": {
    term: "Participation Rights",
    definition: "The right of preferred shareholders to receive their liquidation preference AND participate in remaining proceeds as if they converted to common stock.",
    example: "Participating preferred gets their investment back plus a share of remaining proceeds."
  },
  
  "conversion_rights": {
    term: "Conversion Rights",
    definition: "The right of preferred shareholders to convert their shares to common stock, typically exercised when it's more valuable than the liquidation preference.",
    example: "Convert to common if your share of proceeds exceeds your liquidation preference."
  },
  
  // SAFEs & Convertibles
  "safe": {
    term: "SAFE (Simple Agreement for Future Equity)",
    definition: "An investment contract that gives investors the right to purchase equity in a future financing round, typically with a valuation cap and/or discount.",
    example: "A $100K SAFE with a $5M cap converts to equity when the company raises a Series A."
  },
  
  "valuation_cap": {
    term: "Valuation Cap",
    definition: "The maximum valuation at which a SAFE or convertible note will convert to equity, protecting early investors from excessive dilution.",
    example: "A $5M cap means the SAFE converts as if the company is valued at $5M, even if the actual valuation is higher."
  },
  
  "discount_rate": {
    term: "Discount Rate",
    definition: "A percentage discount that SAFE or convertible note holders receive on the price per share in the next funding round.",
    example: "A 20% discount means you pay $0.80 per share when others pay $1.00."
  },
  
  "convertible_note": {
    term: "Convertible Note",
    definition: "A debt instrument that converts to equity in a future financing round, typically with interest, maturity date, and conversion terms.",
    example: "A $50K convertible note with 8% interest converts to equity in the Series A round."
  },
  
  // Options & Vesting
  "stock_options": {
    term: "Stock Options",
    definition: "The right to purchase company shares at a fixed price (strike price) for a certain period, typically granted to employees and advisors.",
    example: "Options to buy 1,000 shares at $1 per share, vesting over 4 years."
  },
  
  "strike_price": {
    term: "Strike Price",
    definition: "The fixed price at which stock options can be exercised to purchase shares, usually set at fair market value when granted.",
    example: "Options with a $2 strike price allow purchase of shares at $2 each, regardless of current value."
  },
  
  "vesting_schedule": {
    term: "Vesting Schedule",
    definition: "The timeline over which stock options or restricted stock become exercisable or owned, typically to encourage retention.",
    example: "4-year vesting with 1-year cliff: 25% vests after year 1, then 1/48th monthly."
  },
  
  "cliff_vesting": {
    term: "Cliff Vesting",
    definition: "A period during which no equity vests, after which a large portion vests at once, typically used to ensure commitment.",
    example: "1-year cliff means no options vest for 12 months, then 25% vests all at once."
  },
  
  "exercise": {
    term: "Exercise Options",
    definition: "The act of purchasing shares by paying the strike price, converting options into actual stock ownership.",
    example: "Exercise 1,000 options at $2 strike price = pay $2,000 to own 1,000 shares."
  },
  
  // Advanced Terms
  "drag_along": {
    term: "Drag-Along Rights",
    definition: "The right of majority shareholders to force minority shareholders to join in the sale of a company.",
    example: "If founders want to sell and have drag-along rights, they can force all shareholders to sell their shares too."
  },
  
  "tag_along": {
    term: "Tag-Along Rights",
    definition: "The right of minority shareholders to join a sale initiated by majority shareholders on the same terms.",
    example: "If founders sell their shares, employees with tag-along rights can sell theirs at the same price."
  },
  
  "pro_rata": {
    term: "Pro Rata Rights",
    definition: "The right of existing investors to participate in future funding rounds to maintain their ownership percentage.",
    example: "An investor with 10% ownership can invest 10% of a new round to maintain their percentage."
  },
  
  "right_of_first_refusal": {
    term: "Right of First Refusal",
    definition: "The right to purchase shares before they can be sold to third parties, typically held by the company or existing investors.",
    example: "If an employee wants to sell shares, the company gets first chance to buy them at the offered price."
  },
  
  // Corporate Actions
  "stock_split": {
    term: "Stock Split",
    definition: "Increasing the number of shares outstanding by issuing additional shares to existing shareholders, typically to reduce share price.",
    example: "A 2-for-1 split gives you 2 shares for every 1 you owned, but each is worth half as much."
  },
  
  "reverse_split": {
    term: "Reverse Stock Split",
    definition: "Reducing the number of shares outstanding by combining existing shares, typically to increase share price.",
    example: "A 1-for-10 reverse split combines 10 shares into 1 share worth 10x the original price."
  },
  
  "recapitalization": {
    term: "Recapitalization",
    definition: "Restructuring a company's capital structure, often involving changes to debt-to-equity ratios or share classes.",
    example: "Converting debt to equity or creating new share classes with different rights."
  }
};

export function getEquityTerm(key: string): EquityTerm | undefined {
  return equityTerms[key];
}

export function searchEquityTerms(query: string): EquityTerm[] {
  const searchTerm = query.toLowerCase();
  return Object.values(equityTerms).filter(
    term => 
      term.term.toLowerCase().includes(searchTerm) ||
      term.definition.toLowerCase().includes(searchTerm)
  );
}