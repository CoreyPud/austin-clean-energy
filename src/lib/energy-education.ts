export interface Question {
  id: string;
  module: number;
  type: "pre" | "post";
  questionText: string;
  options: string[];
  correctAnswer: number; // 0-indexed position in options array
  explanation: string;
}

export interface ModuleData {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

export const quizData: ModuleData[] = [
  {
    id: 1,
    title: "Module 1: Austin Energy & General Fund Link",
    description:
      "Enterprise Fund mechanics, General Fund Transfer (GFT), and cash reserve governance.",
    questions: [
      {
        id: "m1-pre-1",
        module: 1,
        type: "pre",
        questionText:
          "How does Austin Energy's financial structure primarily differ from standard municipal departments like Parks or Police?",
        options: [
          "It is directly funded through local commercial and residential property tax assessments.",
          "It operates as an Enterprise Fund, relying on customer rate revenues rather than property taxes.",
          "It receives 100% of its operating revenue from Texas state sales tax rebates.",
          "It is a non-profit foundation managed directly by the Travis County Commissioners Court.",
        ],
        correctAnswer: 1,
        explanation:
          "Austin Energy is a municipal Enterprise Fund that operates as a self-sustaining business entity funded by utility rate revenues rather than property taxes.",
      },
      {
        id: "m1-post-1",
        module: 1,
        type: "post",
        questionText:
          "If City Council increases the General Fund Transfer (GFT) rate above recommended financial policy guidelines, what immediate risk does the utility face?",
        options: [
          "Automatic loss of its ERCOT market operating license.",
          "Erosion of cash reserves below the 150-day target, triggering potential credit rating downgrades.",
          "An immediate federal fine from the Federal Energy Regulatory Commission (FERC).",
          "A mandatory 50% reduction in city employee benefit contributions.",
        ],
        correctAnswer: 1,
        explanation:
          "Excessive GFT withdrawals drain utility working capital below liquidity targets (such as 150 days of cash on hand), which risks credit rating downgrades and raises borrowing costs.",
      },
    ],
  },
  {
    id: 2,
    title: "Module 2: Generation Economics, Energy Sources & Financing",
    description:
      "LCOE, solar + storage firming, IRA Section 6417 direct pay, and PPAs.",
    questions: [
      {
        id: "m2-pre-1",
        module: 2,
        type: "pre",
        questionText:
          "Why is standalone solar photovoltaic (PV) generation not directly comparable to a natural gas combined-cycle plant on a pure LCOE basis?",
        options: [
          "Solar panels operate on direct current (DC) while natural gas plants use alternating current (AC).",
          "LCOE accounts for capital and operating costs but does not capture non-dispatchability or firming costs.",
          "Solar energy is legally exempt from ERCOT transmission grid charges.",
          "Natural gas facilities are entirely financed through federal income tax credits.",
        ],
        correctAnswer: 1,
        explanation:
          "LCOE measures lifetime energy cost per MWh generated, but it does not account for intermittency or the additional capacity costs (such as BESS) required to firm variable generation.",
      },
      {
        id: "m2-post-1",
        module: 2,
        type: "post",
        questionText:
          "Under Inflation Reduction Act (IRA) Section 6417 Direct Pay, how can tax-exempt municipal utilities like Austin Energy leverage federal clean energy incentives?",
        options: [
          "They can issue tax credits directly to local residential ratepayers as municipal utility bill refunds.",
          "They can receive direct cash payments from the IRS equal to 30%+ of eligible clean energy capital investments.",
          "They can avoid paying state sales tax on natural gas power plant fuel purchases.",
          "They are granted tax deduction certificates that can be sold on public stock exchanges.",
        ],
        correctAnswer: 1,
        explanation:
          "Section 6417 Direct Pay allows non-taxable entities (like public power utilities) to receive direct cash payments from the federal government equivalent to traditional Investment Tax Credits (ITC).",
      },
    ],
  },
  {
    id: 3,
    title: "Module 3: Austin Water Economics & Infrastructure Finance",
    description:
      "Volumetric rate paradox, fixed debt service overhead, and drought impacts.",
    questions: [
      {
        id: "m3-pre-1",
        module: 3,
        type: "pre",
        questionText:
          "What financial dilemma occurs when Austin Water achieves high levels of public water conservation during severe droughts?",
        options: [
          "Water production costs rise proportionally with reduced customer volume.",
          "Volumetric rate revenues drop sharply while high fixed debt service costs for water infrastructure remain unchanged.",
          "The utility is legally forced to issue emergency General Obligation bonds to cover chemical costs.",
          "Federal EPA grants are automatically revoked due to lower water throughput.",
        ],
        correctAnswer: 1,
        explanation:
          "Austin Water has high fixed capital costs (treatment plants, pipes, debt service). When volumetric sales drop due to conservation or drought, total revenue falls faster than operating expenses.",
      },
      {
        id: "m3-post-1",
        module: 3,
        type: "post",
        questionText:
          "How does Austin Water's utility transfer to the General Fund differ from Austin Energy's General Fund Transfer (GFT)?",
        options: [
          "Austin Water's transfer is capped at a lower percentage (~8.2% of gross revenue) and faces distinct state-level statutory scrutiny.",
          "Austin Water transfers 100% of its net profits to Travis County rather than the City of Austin.",
          "Austin Water's transfer is funded entirely through Travis County property tax revenues.",
          "Austin Water is prohibited by the Texas Constitution from transferring any revenue to the city.",
        ],
        correctAnswer: 0,
        explanation:
          "Austin Water's gross revenue transfer cap (~8.2%) is lower than Austin Energy's (~11.6%) and operates under separate charter parameters and legal guidelines.",
      },
    ],
  },
  {
    id: 4,
    title: "Module 4: Transportation, Public Works & Mobility Funding",
    description:
      "Transportation User Fee (TUF), mobility bond debt, and intergovernmental transit funding.",
    questions: [
      {
        id: "m4-pre-1",
        module: 4,
        type: "pre",
        questionText:
          "How is routine street maintenance, street lighting, and sidewalk repair primarily funded in Austin outside of property tax debt bonds?",
        options: [
          "Through a dedicated portion of the Texas State Gasoline Tax.",
          "Via the Transportation User Fee (TUF) assessed directly on monthly municipal utility bills.",
          "Using 100% of annual parking meter revenue collected by Travis County.",
          "From toll road surplus distributions provided by the Central Texas Regional Mobility Authority (CTRMA).",
        ],
        correctAnswer: 1,
        explanation:
          "The Transportation User Fee (TUF) is an ongoing fee billed on municipal utility statements based on property land use to fund street maintenance and safety operations.",
      },
      {
        id: "m4-post-1",
        module: 4,
        type: "post",
        questionText:
          "Why is it important for City Council members to distinguish between Transportation User Fees (TUF) and voter-approved Mobility Bonds?",
        options: [
          "TUF funds ongoing operation/maintenance out of utility bills, while Mobility Bonds fund capital projects backed by debt service.",
          "TUF is legally restricted to highway expansion, whereas Mobility Bonds can only fund sidewalks.",
          "Mobility Bonds are paid entirely by federal grants, while TUF is paid by Travis County.",
          "TUF requires an annual public vote, whereas Mobility Bonds are approved by the City Manager alone.",
        ],
        correctAnswer: 0,
        explanation:
          "TUF is operational funding collected via utility bill fees, whereas Mobility Bonds represent long-term municipal debt approved by voters for major capital projects.",
      },
    ],
  },
  {
    id: 5,
    title: "Module 5: Demand-Side Management & Capstone Integration",
    description:
      "Peak load dynamics, demand response, 'negawatts', and comprehensive municipal budgeting.",
    questions: [
      {
        id: "m5-pre-1",
        module: 5,
        type: "pre",
        questionText:
          "In electricity system planning, what is meant by the economic concept of a 'negawatt'?",
        options: [
          "A megawatt of electricity lost due to transmission line resistance.",
          "A unit of energy saved through efficiency or demand reduction that avoids the cost of new generation.",
          "A negative electricity price event occurring during high wind generation hours.",
          "The baseline power output of an idling natural gas peaker plant.",
        ],
        correctAnswer: 1,
        explanation:
          "A 'negawatt' represents avoided energy consumption achieved through efficiency or demand response, which is often far cheaper than generating a new megawatt of peak electricity.",
      },
      {
        id: "m5-post-1",
        module: 5,
        type: "post",
        questionText:
          "During extreme heat events in Austin, why is deploying Automated Demand Response (ADR) more cost-effective than starting up gas peaker plants?",
        options: [
          "Demand response reduces peak demand when spot power market prices are highest, avoiding expensive fuel and capacity costs.",
          "Gas peaker plants take over 48 hours to start up during summer afternoons.",
          "ERCOT penalizes municipal utilities with fines whenever gas peaker plants are activated.",
          "Demand response generates excess electricity that can be resold to neighboring states.",
        ],
        correctAnswer: 0,
        explanation:
          "Peak power from natural gas peaker plants or wholesale markets during heatwaves carries high marginal costs. Curtailing demand via demand response avoids these extreme peak generation expenses.",
      },
    ],
  },
];

export const allQuestions: Question[] = quizData.flatMap((m) => m.questions);
