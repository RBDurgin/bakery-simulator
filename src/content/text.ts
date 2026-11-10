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
    lookLegend: 'Pick your baker',
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

  phase: {
    morning: 'Morning',
    evening: 'Evening',
  },

  world: {
    sceneLabel: (place: string) => `${place}. Tap a thing to walk there.`,
    baker: (playerName: string) => `${playerName}, the baker`,
    closesIn: (time: string) => `Shop closes in ${time}`,
    clockLabel: 'Time left today',
    pause: 'Pause',
    walking: 'Walking…',
  },

  things: {
    price: (price: string) => `${price} each`,
    signClosed: 'Closed',
    signOpen: 'Open',
    ovenEmpty: 'Empty',
    ovenBaking: (name: string) => `Baking ${name}`,
    ovenReady: (name: string) => `${name} ready!`,
    ovenBurnt: 'Burnt',
    bakeProgress: 'Baking progress',
    customersHeading: 'Customers',
    serveLabel: (name: string) => `Serve ${name}`,
    patience: 'How long this customer will wait',
  },

  /** What the line under the scene says after each job. One or two short sentences. */
  messages: {
    goodMorning: (playerName: string) => `Good morning, ${playerName}! Tap the door to go out.`,
    arrived: {
      home: 'You are at home.',
      street: 'You are on the street.',
      market: 'You are at the market. Tap a stall to buy.',
      bakery: 'You are in your bakery.',
    },
    stallClosed: 'The market is closed. Come back in the morning.',
    nothingToBake:
      'You have nothing to bake. Buy ingredients at the market, or tap the sign again to open anyway.',
    shopOpened: 'The shop is open! Tap the oven to bake.',
    shopIsOpen: 'The shop is open. Use Pause to close early.',
    shopClosed: 'The shop is closed for today.',
    stayInShop: 'The shop is open, so stay inside.',
    ovenCold: 'Open the shop first. Then you can bake.',
    bakingStarted: (name: string) => `${name} are in the oven. Come back when they are ready.`,
    ovenBaking: (name: string) => `${name} are still baking.`,
    tookOut: (count: number, name: string) => `${count} ${name} are on the shelf.`,
    burnt: (name: string) => `Oh no, the ${name} burnt. It happens to every baker!`,
    shelfEmpty: 'The shelf is empty. Bake something!',
    shelf: (items: string) => `On the shelf: ${items}.`,
    counterClosed: 'Customers come when the shop is open.',
    nobodyWaiting: 'No one is waiting. Customers will come soon.',
    served: (name: string, price: string) => `You sold 1 ${name} for ${price}.`,
    noStock: (name: string) => `There is no ${name} on the shelf. Bake some!`,
    customerGone: 'That customer has gone.',
    closingTime: 'Closing time! Tap the till to count your money.',
    tillLater: 'Count the till when the shop closes.',
    countTillFirst: 'Count the till before you go home.',
    goHome: 'Well done today! Now go home to bed.',
    notBedtime: 'It is not bedtime yet. Time to go to work!',
  },

  stall: {
    heading: (name: string) => `${name} stall`,
    yourMoney: 'Your money',
    have: (count: number) => `You have ${count}`,
    buy: 'Buy 1',
    forPrice: (price: string) => `for ${price}`,
    recipesHeading: 'What you can bake',
    needs: 'Needs:',
    makes: (count: number, price: string) => `Makes ${count}. Sells for ${price} each.`,
    batches: (count: number) =>
      count === 0
        ? 'You need more ingredients.'
        : `You can bake ${count} ${plural(count, 'batch', 'batches')}.`,
    done: 'Done',
  },

  oven: {
    heading: 'What will you bake?',
    bake: 'Bake',
    bakeLabel: (name: string) => `Bake ${name}`,
    cannotBake: 'You need more ingredients.',
    notNow: 'Not now',
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
    done: 'Done',
  },
} as const;
