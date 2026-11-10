/**
 * Player-facing text. Keep copy here rather than in components, so wording
 * can be changed (and checked for reading level) in one place.
 */
const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

export const text = {
  gameTitle: 'Bakery Simulator',
  tagline: 'Bake treats, count your coins, and grow your shop.',
  startButton: 'Start baking',

  newGame: {
    heading: 'Your new bakery',
    intro: 'Pick a name for your bakery and for you.',
    bakeryNameLabel: 'Bakery name',
    playerNameLabel: 'Your name',
    nameHint: (max: number) => `Up to ${max} letters.`,
    submit: 'Open my bakery',
    back: 'Back',
  },

  sign: {
    day: (day: number) => `Day ${day}`,
    money: 'Money',
    stars: (stars: number) => `${stars} out of 5 stars`,
  },

  morning: {
    heading: (playerName: string) => `Good morning, ${playerName}!`,
    intro: 'Buy what you need, then open the shop.',
    shopHeading: 'Buy ingredients',
    have: (count: number) => `You have ${count}`,
    buy: 'Buy',
    recipesHeading: 'What you can bake',
    needs: 'Needs:',
    makes: (count: number, price: string) => `Makes ${count}. Sells for ${price} each.`,
    batches: (count: number) =>
      count === 0
        ? 'You need more ingredients.'
        : `You can bake ${count} ${plural(count, 'batch', 'batches')}.`,
    nothingToBake: 'Tip: buy ingredients first, so you have something to bake.',
    openShop: 'Open the shop',
  },

  open: {
    heading: 'The shop is open',
    closesIn: (time: string) => `Shop closes in ${time}`,
    clockLabel: 'Time left today',
    ovenHeading: 'Oven',
    ovenEmpty: 'The oven is empty. Pick something to bake.',
    bake: (name: string) => `Bake ${name}`,
    baking: (name: string) => `Baking ${name}…`,
    bakeProgress: 'Baking progress',
    ready: (name: string) => `Ding! ${name} ready. Take them out before they burn.`,
    takeOut: 'Take out',
    burnt: (name: string) => `Oh no, the ${name} burnt. It happens to every baker!`,
    clearOven: 'Clean the oven',
    shelfHeading: 'Shelf',
    customersHeading: 'Customers',
    noCustomers: 'No one is waiting. Customers will come soon.',
    wants: (name: string) => `Wants: ${name}`,
    patience: 'How long this customer will wait',
    serve: 'Serve',
    serveLabel: (name: string) => `Serve ${name}`,
    pause: 'Pause',
  },

  pause: {
    heading: 'Game paused',
    body: 'Take your time. The clock is stopped.',
    resume: 'Keep playing',
    closeShop: 'Close the shop for today',
  },

  evening: {
    heading: (day: number) => `Day ${day} is done!`,
    reportFor: (playerName: string, bakeryName: string) =>
      `${playerName}'s report for ${bakeryName}`,
    moneyHeading: 'Money',
    income: 'Money earned',
    spent: 'Money spent',
    profit: 'Profit',
    profitExplained: 'Profit is money earned take away money spent.',
    profitUp: (amount: string) => `You made ${amount} more than you spent. Great job!`,
    profitEven: 'You earned just as much as you spent.',
    profitDown: (amount: string) =>
      `You spent ${amount} more than you earned. That is okay! Try again tomorrow.`,
    soldHeading: 'Sold',
    nothingSold: 'Nothing sold today.',
    wastedHeading: 'Wasted',
    nothingWasted: 'Nothing was wasted. Well done!',
    customersHeading: 'Customers',
    happyCustomers: 'Happy customers',
    lostCustomers: 'Customers who left',
    starsHeading: 'Your stars',
    nextDay: (day: number) => `Start day ${day}`,
  },
} as const;
