/**
 * Flamingo Pay — Viral joke bank for buyer payment screens.
 *
 * Categories: SA township humour, global celebrity roasts, pop culture,
 * fourth-wall breaks, tech jokes, relationship humour, food culture,
 * motivational parody, zodiac roasts, sports, music, gen-z, boomer,
 * animals, conspiracy theories, and pure unhinged chaos.
 *
 * These rotate randomly on success, failure, and processing screens.
 * The goal: make every scan shareable. Make people screenshot.
 * Make them come back just to see what joke they get next.
 */

export type ViralQuote = { emoji: string; headline: string; sub: string };

// ═══════════════════════════════════════════════════════════════
//  SUCCESS QUOTES — shown after payment completes
// ═══════════════════════════════════════════════════════════════

export const SUCCESS_QUOTES: ViralQuote[] = [
  // ══════════════════════════════════════
  //  SA CULTURE & TOWNSHIP VIBES
  // ══════════════════════════════════════
  { emoji: "🔥", headline: "Hotter than a braai with no tongs", sub: "You just grabbed that payment with your bare hands. Respect." },
  { emoji: "⚡", headline: "Eskom could never", sub: "Your payment arrived in 2 seconds. Your electricity? See you in 4 hours." },
  { emoji: "🚕", headline: "Your rands just caught a quantum taxi", sub: "No waiting at the rank. No arguing about change. Just poof. Gone." },
  { emoji: "🤝", headline: "Ancestors called. They're impressed.", sub: "Gogo said 'in my day we used cash.' Then she downloaded the app." },
  { emoji: "🍗", headline: "Smoother than a Nando's extra mild", sub: "Except this actually had flavour. And speed. And no queue." },
  { emoji: "🏆", headline: "Winner winner, 7 colours dinner", sub: "You paid. They smiled. Dumpling did a little dance." },
  { emoji: "🧃", headline: "Sipping on that cashless juice", sub: "No coins jingling in your pocket like a toddler's toy. Just elegance." },
  { emoji: "🫡", headline: "You absolute legend of a human", sub: "Some people talk about supporting local. You actually did it. With a phone." },
  { emoji: "🎵", headline: "This payment has log drum energy", sub: "Amapiano bassline. No skips. Your bank is doing the backspin." },
  { emoji: "🪩", headline: "Your wallet just did the Kilimanjaro", sub: "Everybody's happy. The DJ is playing. The rands are vibing." },
  { emoji: "🧊", headline: "Ice cold execution", sub: "You walked in. Scanned. Paid. Walked out. They're still shook." },
  { emoji: "🌍", headline: "One small scan for man, one giant flex for SA", sub: "Neil Armstrong walked on the moon. You paid a spaza with a QR code. Same energy." },
  { emoji: "🦩", headline: "Cash is dead. You attended the funeral.", sub: "Cards sent flowers. QR codes delivered the eulogy." },
  { emoji: "🚂", headline: "Faster than Metrorail on its best day", sub: "And unlike Metrorail, we actually arrived. On time. First try." },
  { emoji: "🏠", headline: "Your money moved out of your account", sub: "Found its own place. Paying rent at a local business. Growing up so fast." },
  { emoji: "🎤", headline: "DJ Maphorisa wants to sample this transaction", sub: "The bassline of your payment just went platinum. Abalele." },
  { emoji: "🥊", headline: "Faster than a Dricus du Plessis takedown", sub: "Three seconds. Boom. It's over. The crowd goes wild. The ref stops counting." },
  { emoji: "🏏", headline: "Proteas wish they finished like that", sub: "No choking. No drama. Just clean execution under pressure." },
  { emoji: "🌭", headline: "Smoother than a boerie roll at the rugby", sub: "Mustard and chakalaka on top. No mess. Chef's kiss." },
  { emoji: "🚗", headline: "Your payment just overtook a BMW on the N1", sub: "No indicator. No hesitation. Just pure audacity. Respect." },
  { emoji: "💡", headline: "Brighter than stage 1 loadshedding", sub: "Wait, that doesn't work. Point is — your payment went through and the lights didn't." },
  { emoji: "📱", headline: "Your phone just became a till", sub: "No card machine rental. No R500/month fee. Just a phone and ambition." },
  { emoji: "🏖️", headline: "Payment went through like Durban July traffic", sub: "Actually no, this was faster. Way faster. Like, embarrassingly faster." },
  { emoji: "🎶", headline: "Oscar Mbo just dropped a set about your payment", sub: "Deep house bassline. Warm pads. Your rands floating into the sunset." },
  { emoji: "🛒", headline: "Shoprite express lane energy", sub: "12 items or less. No queue. In and out. The dream." },
  { emoji: "🥤", headline: "Refreshing like a cold Stoney on a hot day", sub: "That ginger burn at the back of your throat? That's financial satisfaction." },
  { emoji: "🐓", headline: "Earlier than a Soweto rooster", sub: "4am energy. Your payment crowed before the sun was even up." },
  { emoji: "🎯", headline: "More accurate than a taxi driver's change", sub: "R47.50? Here's your R2.50. No complaints. No short-changing. Just vibes." },
  { emoji: "🧹", headline: "Cleaner than your kitchen before guests arrive", sub: "Spotless transaction. Mama would be proud. She'd still find something to clean though." },
  { emoji: "🦅", headline: "Majestic like a Bateleur eagle over Kruger", sub: "Your payment soared. Graceful. Powerful. Didn't even flap." },
  { emoji: "🏡", headline: "Your money went to visit family in the township", sub: "It's at a local business now. Having Sunday lunch. Don't disturb it." },
  { emoji: "🚌", headline: "Faster than the Baz Bus and twice as reliable", sub: "Your payment didn't stop at every backpacker's. It went direct." },
  { emoji: "🔑", headline: "You just unlocked spaza boss level", sub: "Achievement: paid without fumbling for coins for 47 seconds. Elite." },
  { emoji: "🧠", headline: "Big brain moment: skipped the ATM queue", sub: "Those 14 people behind the lady depositing coins? Not your problem anymore." },
  { emoji: "🎉", headline: "Your payment just registered a PPE company", sub: "Kidding. It went to a real business. That actually does real things." },
  { emoji: "🦩", headline: "Flamingo stance: one leg, zero problems", sub: "Standing tall. Looking pretty. Your payment did the same." },
  { emoji: "🏋️", headline: "Your thumb just bench pressed a payment", sub: "One tap. Done. Your thumb is basically a financial athlete now." },
  { emoji: "🎬", headline: "Bollywood wishes their endings were this good", sub: "No rain scene. No running through a field. Just a clean payment." },
  { emoji: "🧵", headline: "Stitched tighter than a shweshwe dress", sub: "Beautiful. Traditional. And surprisingly good with technology." },
  { emoji: "🚿", headline: "Cleaner than Joburg water on a good day", sub: "Crystal clear transaction. No brown stuff. We promise." },
  { emoji: "🎓", headline: "You just graduated from Cash University", sub: "Summa cum laude in QR payments. Your parents are crying. Happy tears." },
  { emoji: "🛫", headline: "Your money just emigrated to a better place", sub: "It's still in SA though. Just at a business that deserves it." },
  { emoji: "🪁", headline: "Higher than a kite at Cape Town Kite Festival", sub: "Your payment is soaring. Wind beneath its wings. Poetic, really." },
  { emoji: "🥁", headline: "Drum roll please...", sub: "Payment successful! The crowd goes wild. Someone's doing a vosho." },

  // ══════════════════════════════════════
  //  GLOBAL CELEBRITY ROASTS
  // ══════════════════════════════════════
  { emoji: "👑", headline: "Beyoncé called. She's taking notes.", sub: "Your payment formation was flawless. No backup dancers needed." },
  { emoji: "🏀", headline: "MJ would retire again watching this", sub: "Your payment had a fadeaway finish. Nothing but net. The GOAT acknowledges you." },
  { emoji: "🎬", headline: "Drake started following your bank account", sub: "He saw that transfer go through and caught feelings. Again." },
  { emoji: "😎", headline: "Elon tried to buy this payment for $44 billion", sub: "We said no. Some things are priceless. Like your face right now." },
  { emoji: "💅", headline: "Rihanna paused Fenty for this", sub: "She saw your payment clear and whispered 'shine bright like a QR code.'" },
  { emoji: "🤵", headline: "James Bond never paid this smoothly", sub: "Shaken, not stirred? Nah. Scanned, not swiped. Upgrade." },
  { emoji: "🎤", headline: "Adele rolled this deep in your account", sub: "She set fire to the amount. From the other side of the QR code." },
  { emoji: "🕷️", headline: "Even Spider-Man can't web payments this fast", sub: "With great scanning power comes great financial responsibility." },
  { emoji: "👾", headline: "Thanos snapped and your money disappeared", sub: "But unlike half the universe, it went somewhere useful. Perfectly balanced." },
  { emoji: "🐉", headline: "Khaleesi wishes she had this fire", sub: "Your payment: Dracarys. Their bank account: toast. In a good way." },
  { emoji: "🧙", headline: "Gandalf said 'you shall not pass'", sub: "Your payment said 'watch me' and sprinted through anyway." },
  { emoji: "🏎️", headline: "Lewis Hamilton just got lapped", sub: "Your payment did the straight in 1.2 seconds. New track record." },
  { emoji: "🎹", headline: "Beethoven couldn't compose a better transaction", sub: "Da da da DUM. That's your payment arriving in symphony form." },
  { emoji: "🤖", headline: "ChatGPT wrote a poem about your payment", sub: "Roses are red, your wallet is light, this QR transaction was absolutely right." },
  { emoji: "🥷", headline: "John Wick retired after seeing this", sub: "The precision. The efficiency. No wasted movement. He's impressed." },
  { emoji: "👨‍🍳", headline: "Gordon Ramsay rated this payment", sub: "'Finally! Some good financial decisions!' He's crying. We're crying." },
  { emoji: "🧤", headline: "OJ's glove fit better than this", sub: "Wait no. Your payment fit PERFECTLY. Unlike... anyway. Moving on." },
  { emoji: "🎪", headline: "Barnum would put this payment in the circus", sub: "Ladies and gentlemen, the greatest transaction on earth." },
  { emoji: "🦸", headline: "Marvel wants to cast your payment in Phase 7", sub: "Origin story: scanned a QR code. Became a hero. No training montage needed." },
  { emoji: "🧊", headline: "Cooler than The Rock in sunglasses", sub: "Can you smell what this payment is cooking? Success. It's cooking success." },
  { emoji: "📺", headline: "Netflix wants to make a docuseries about this", sub: "'The QR Code That Changed Everything.' 4 episodes. 97% on Rotten Tomatoes." },
  { emoji: "🎮", headline: "GTA heist complete: real-life edition", sub: "Except legal. And peaceful. And nobody got a wanted star." },
  { emoji: "🎵", headline: "Taylor Swift wrote a song about this payment", sub: "It's called 'We Are Never Getting This Money Back (Together).' It's a banger." },
  { emoji: "🥊", headline: "Mike Tyson bit the ear off less efficiently", sub: "Your payment just KO'd the concept of cash. Round 1. TKO." },
  { emoji: "🧔", headline: "Keanu Reeves thinks you're breathtaking", sub: "He saw this transaction and whispered 'you're breathtaking.' We all cried." },
  { emoji: "🎭", headline: "Leonardo DiCaprio finally won an Oscar for this", sub: "Best Supporting Payment in a Leading Role. The Academy is shook." },
  { emoji: "🍝", headline: "Even The Godfather couldn't refuse this payment", sub: "An offer you can't refuse: scan, pay, done. The QR Mafia appreciates you." },
  { emoji: "🧠", headline: "Oppenheimer just witnessed financial fission", sub: "I am become payment, destroyer of cash. Now we are all become QR." },
  { emoji: "🏃", headline: "Usain Bolt just saw your payment time", sub: "9.58 seconds for 100m? Cute. Your payment: 1.2 seconds. New world record." },
  { emoji: "🎩", headline: "Harry Potter tried casting 'Accio Payment'", sub: "It failed. Because your payment was already there. Faster than magic." },
  { emoji: "🎯", headline: "Steph Curry called this a three-pointer", sub: "Nothing but net. From half court. Blindfolded. Your payment doesn't miss." },
  { emoji: "🦇", headline: "Batman couldn't track money this efficiently", sub: "And he's literally a billionaire detective. Your phone: 1. The Batcave: 0." },
  { emoji: "🕶️", headline: "Neo chose the pink pill", sub: "Welcome to the Flamingo Matrix. The truth? Cash was never real." },
  { emoji: "🎤", headline: "Kanye interrupted this payment to say—", sub: "Actually never mind. Your payment was the best payment of all time. OF ALL TIME." },
  { emoji: "🧊", headline: "Mr. Freeze is jealous of how cold that was", sub: "Ice cold execution. Arnold Schwarzenegger voice: 'Chill out.' Payment: done." },
  { emoji: "🌊", headline: "Aquaman can't move currency this fluidly", sub: "Under the sea, over the banks, through the system. Payment: landed." },
  { emoji: "🎬", headline: "Quentin Tarantino wants to direct the sequel", sub: "'Kill Bill Vol. 3: The QR Code.' Non-linear timeline. Same payment." },
  { emoji: "🎤", headline: "Cardi B said 'okurrr' to this payment", sub: "Money moves. Literally. From your account. To theirs. Okurrrrrr." },

  // ══════════════════════════════════════
  //  FOURTH WALL & SELF-AWARE
  // ══════════════════════════════════════
  { emoji: "🦩", headline: "You're reading this on a payment app", sub: "Made by a flamingo. Powered by vibes. You could be doing anything else. But here you are." },
  { emoji: "📱", headline: "This joke was written at 2am", sub: "By a developer who's had 4 coffees and no sleep. You're welcome." },
  { emoji: "🎭", headline: "Plot twist: you're the main character", sub: "This whole payment page was designed for this exact moment. Just you. Reading this." },
  { emoji: "📖", headline: "They put jokes on a payment app", sub: "And you're reading every single word. We see you. We appreciate you." },
  { emoji: "🤫", headline: "Nobody reads the success screen", sub: "Except you. You legend. Most people screenshot and leave. You actually read." },
  { emoji: "🧠", headline: "Your brain chose to process this joke", sub: "Instead of doing literally anything productive. We respect the commitment." },
  { emoji: "💀", headline: "Imagine explaining this to your grandkids", sub: "'I paid for bread using a pink bird app and it made me laugh.' 'Sure, grandpa.'" },
  { emoji: "🦩", headline: "Fun fact: a flamingo can stand on one leg", sub: "So can your bank account after this payment. Barely. But it's standing." },
  { emoji: "🎲", headline: "You got this joke randomly out of hundreds", sub: "Some people got funnier ones. Some got worse. This is yours. Own it." },
  { emoji: "🕰️", headline: "You've been on this screen for 8 seconds", sub: "That's longer than most people's attention span. We're flattered. Truly." },
  { emoji: "🪞", headline: "Look at you. Paying people. With a phone.", sub: "If 2005 you could see this. They'd be so confused. And slightly proud." },
  { emoji: "📊", headline: "Analytics says 73% of people smile here", sub: "The other 27% are dead inside. Which one are you? Don't answer that." },
  { emoji: "🤳", headline: "Go ahead. Screenshot this.", sub: "We know you want to. Send it to your group chat. We'll wait." },
  { emoji: "📝", headline: "This joke was A/B tested against 0 people", sub: "Budget: R0. QA team: the developer's cat. Somehow we shipped it. Here it is." },
  { emoji: "🎰", headline: "There are 500+ jokes in this app", sub: "You got this one. Is it the best? Debatable. Is it yours? Absolutely." },
  { emoji: "🧪", headline: "You are part of an experiment", sub: "The experiment: can a payment app be funnier than your friends? Results: pending." },
  { emoji: "🦩", headline: "The person who coded this screen is watching", sub: "Not really. But imagine. They'd be so proud you read the whole thing." },
  { emoji: "🎬", headline: "Credits: You — starring role. Payment — best supporting.", sub: "Director: your thumb. Producer: your bank account. Budget: declining." },
  { emoji: "📺", headline: "If this was a TV show, this is the finale", sub: "The payment landed. The music swells. You stare into the distance. Roll credits." },
  { emoji: "🗳️", headline: "Vote: was this joke funny?", sub: "Just kidding, there's no vote button. But the fact you're still reading says yes." },
  { emoji: "💭", headline: "You're thinking about screenshotting this", sub: "Do it. Or don't. But you'll think about it later tonight. We live in your head now." },
  { emoji: "🎤", headline: "Is this a payment app or a comedy show?", sub: "Why not both? You paid AND you laughed. That's called efficiency." },
  { emoji: "📲", headline: "Your phone just earned its monthly data fee", sub: "All those gigs. All those TikToks. And THIS is the best thing it did today." },
  { emoji: "🦩", headline: "Somewhere, a cash register just felt threatened", sub: "It heard you scanned a QR code. It's updating its CV as we speak." },
  { emoji: "🧬", headline: "This joke's DNA is 50% comedy, 50% payment", sub: "100% unnecessary. But here we are. Together. In this moment. Beautiful." },

  // ══════════════════════════════════════
  //  RELATIONSHIP & LIFE HUMOUR
  // ══════════════════════════════════════
  { emoji: "💅", headline: "Money left and didn't even slam the door", sub: "Peaceful exit. No drama. Unlike your last relationship." },
  { emoji: "🏎️", headline: "Faster than your ex's rebound", sub: "The money moved on before you even blinked. Emotional damage." },
  { emoji: "💸", headline: "Your money ghosted you", sub: "No goodbye. No explanation. Just left. At least it went to a good place." },
  { emoji: "😤", headline: "Your bank account accepted its fate", sub: "It fought briefly. Then it saw the QR code. Then it surrendered." },
  { emoji: "💔", headline: "Your wallet has trust issues now", sub: "It's been through a lot today. Give it a hug. Then scan again tomorrow." },
  { emoji: "🫠", headline: "That was suspiciously easy", sub: "No queue. No PIN. No 'card declined' embarrassment. What is this sorcery." },
  { emoji: "🧾", headline: "Screenshot this. Frame it. Hang it up.", sub: "This is proof you're a functioning adult. Don't waste this moment." },
  { emoji: "💫", headline: "Manifestation works, apparently", sub: "You visualised paying. You scanned. Money left. The universe delivered." },
  { emoji: "🫶", headline: "Your money found a loving home", sub: "It's with a local business now. It's happy. Please don't call." },
  { emoji: "🥂", headline: "Main character energy detected", sub: "You just paid someone while looking good doing it. The soundtrack in your head? Immaculate." },
  { emoji: "🧘", headline: "Therapist: 'How did paying make you feel?'", sub: "'Powerful. Free. Like I could run through a field.' 'That's just a QR code.' 'Don't ruin this.'" },
  { emoji: "💋", headline: "Your payment was a 10/10", sub: "No notes. Wouldn't change a thing. Would swipe right again." },
  { emoji: "🛋️", headline: "Netflix and payment went through", sub: "Chill. Relax. Your money's already there. No buffering." },
  { emoji: "💘", headline: "Your payment and their account are dating now", sub: "We shipped it. They're happy together. Don't make it weird." },
  { emoji: "🫣", headline: "Your ex could never commit like that", sub: "You saw a QR code. You committed. 2 seconds. Done. Growth." },
  { emoji: "🧳", headline: "Your money packed its bags and left", sub: "Didn't even leave a note. Just a receipt. Modern breakup." },
  { emoji: "🍷", headline: "This payment pairs well with poor decisions", sub: "Like buying that R400 thing you don't need. But this? This was responsible." },
  { emoji: "💌", headline: "Dear Diary, I paid someone today", sub: "It was instant. It was painless. I think I'm in love. With technology." },
  { emoji: "🎭", headline: "Your attachment style: secure payments", sub: "No avoidant transfers. No anxious refreshing. Just healthy financial decisions." },
  { emoji: "🫠", headline: "Situationship? No. This was a full commitment.", sub: "You didn't 'almost' pay. You PAID. Labels. We love them." },

  // ══════════════════════════════════════
  //  TECH & MODERN LIFE
  // ══════════════════════════════════════
  { emoji: "🧠", headline: "200 IQ payment right there", sub: "While people are still counting coins, you're living in 2035." },
  { emoji: "😎", headline: "Accountant energy. CEO execution.", sub: "You just paid someone using a bird app. The future is unhinged." },
  { emoji: "🤯", headline: "Your bank is still processing what happened", sub: "The money arrived before the notification. That's not even legal." },
  { emoji: "🦩", headline: "Welcome to the pink side", sub: "We have QR codes, instant payments, and absolutely zero card machines." },
  { emoji: "🐐", headline: "Absolute GOAT behaviour detected", sub: "You chose QR over fumbling for R4.50 in coins. Society thanks you." },
  { emoji: "📡", headline: "Your payment just went viral", sub: "Not really. But wouldn't it be wild if transactions trended on Twitter?" },
  { emoji: "🤖", headline: "AI couldn't do this better", sub: "And we tried. Claude wrote this joke. The payment? All you, champ." },
  { emoji: "🔋", headline: "Battery at 3% and you still paid", sub: "That's commitment. That's loyalty. That's living on the edge." },
  { emoji: "📶", headline: "1 bar of signal and it still went through", sub: "Your payment has better determination than your wifi connection." },
  { emoji: "🖨️", headline: "Remember printing bank slips?", sub: "LOL. What a time. Now you scan a bird and money moves. Evolution." },
  { emoji: "🧑‍💻", headline: "Some developer debugged for 6 hours", sub: "So you could see this joke after paying R20 for a boerewors roll. Worth it." },
  { emoji: "📵", headline: "Your phone finally did something useful", sub: "After 6 hours of TikTok, 2 hours of WhatsApp, it actually... worked." },
  { emoji: "🔌", headline: "Harder than remembering your wifi password", sub: "But easier than resetting it. Your payment just... went. Like magic." },
  { emoji: "💾", headline: "This payment was saved. Unlike your browser tabs.", sub: "Close some tabs. You have 247 open. Your phone is crying." },
  { emoji: "🤖", headline: "Siri couldn't. Alexa wouldn't. You DID.", sub: "Voice assistants: 0. Your thumb: 1. The score that matters." },
  { emoji: "📱", headline: "Your phone's purpose in life is now complete", sub: "It was born in a factory. Shipped across oceans. All for this moment." },
  { emoji: "🧪", headline: "Science experiment: can you pay without cash?", sub: "Hypothesis: yes. Method: QR scan. Result: CONFIRMED. Publish the paper." },
  { emoji: "🌐", headline: "The internet was invented for this moment", sub: "Not for cat videos. Not for memes. For you. Paying. Right now. Al Gore is proud." },

  // ══════════════════════════════════════
  //  FOOD & CULTURE
  // ══════════════════════════════════════
  { emoji: "🍕", headline: "Easier than splitting a bill", sub: "And nobody had to do that awkward 'I'll get you back' thing." },
  { emoji: "🌮", headline: "Wrapped up tighter than a gatsby", sub: "Everything inside. Nothing falling out. No mess. Just perfection." },
  { emoji: "🍟", headline: "This payment came with extra salt", sub: "Because your friends who still use cash are definitely salty right now." },
  { emoji: "☕", headline: "Warmer than a 5 Roses on a cold morning", sub: "Two sugars of satisfaction. A splash of financial responsibility." },
  { emoji: "🥑", headline: "Millennials can't afford houses BUT", sub: "We can pay a spaza shop with our phones. Priorities." },
  { emoji: "🍦", headline: "Softer than a Spur ice cream landing", sub: "On a Saturday afternoon. After the ribs. When life is perfect." },
  { emoji: "🥩", headline: "Well done. Medium rare. We don't judge.", sub: "But your payment? Chef's kiss. Five stars. Would eat again." },
  { emoji: "🫗", headline: "Poured like a perfect Black Label", sub: "No foam. Full body. Your payment has excellent taste." },
  { emoji: "🥟", headline: "Tastier than a dumpling from China Mall", sub: "You know the one. Top floor. R15 for 8. Your payment has the same value-for-money energy." },
  { emoji: "🧈", headline: "Smoother than butter on a hot mielie", sub: "Melting. Golden. Running down the sides. That's your payment." },
  { emoji: "🍗", headline: "Crispier than KFC original recipe", sub: "Your payment had that crunch. That snap. That 'finger-licking' satisfaction." },
  { emoji: "🫖", headline: "More comforting than rooibos at midnight", sub: "Your payment wrapped you in a blanket of financial security. And warmth." },
  { emoji: "🥘", headline: "This transaction had potjiekos energy", sub: "Slow build. Perfect layers. Everything came together at the end." },
  { emoji: "🍰", headline: "Cherry on top of a malva pudding kind of day", sub: "Sweet. Sticky. Your payment just made everything better." },
  { emoji: "🌽", headline: "Mielie lady on the highway approves", sub: "She counted that money fast. Your phone counted it faster. Respect to both." },

  // ══════════════════════════════════════
  //  ZODIAC ROASTS (every sign gets it)
  // ══════════════════════════════════════
  { emoji: "♈", headline: "Aries: rushed into this payment head first", sub: "No research. No hesitation. Just vibes. Classic Aries. It worked though." },
  { emoji: "♉", headline: "Taurus: spent 20 minutes deciding", sub: "But when you committed? Unshakeable. Your payment has bull energy." },
  { emoji: "♊", headline: "Gemini: your other personality wanted to keep the money", sub: "You won the internal debate. Congratulations. Both of you." },
  { emoji: "♋", headline: "Cancer: you cried a little when the money left", sub: "It's okay. It went to a good home. You can visit it in the receipt." },
  { emoji: "♌", headline: "Leo: you paid just so people could watch you do it", sub: "Main character. Centre stage. Spotlight on. The audience applauds." },
  { emoji: "♍", headline: "Virgo: already calculating the tax implications", sub: "Relax. It's R50 at a braai stand. The IRS doesn't care. Neither does SARS." },
  { emoji: "♎", headline: "Libra: took 10 minutes to choose a payment method", sub: "Balance. Harmony. Also indecision. But you made it. We're proud." },
  { emoji: "♏", headline: "Scorpio: you paid with silent intensity", sub: "No smile. No small talk. Just scan. Pay. Leave. Terrifying. Effective." },
  { emoji: "♐", headline: "Sagittarius: already planning where to scan next", sub: "This payment was just the appetiser. You've got 6 more shops in mind." },
  { emoji: "♑", headline: "Capricorn: this payment is somehow a business expense", sub: "You'll find a way. You always do. Respect the hustle." },
  { emoji: "♒", headline: "Aquarius: paid ironically", sub: "You're not like other payers. You're different. Special. Unique. Still paid R50 though." },
  { emoji: "♓", headline: "Pisces: already emotionally attached to this receipt", sub: "You're going to save it. Look at it later. Maybe write it a poem. Normal behaviour." },

  // ══════════════════════════════════════
  //  SPORTS
  // ══════════════════════════════════════
  { emoji: "⚽", headline: "Ronaldo just said 'SIUUUU' for your payment", sub: "He does that for everything. But this time? Deserved." },
  { emoji: "🏈", headline: "Touchdown! Your money scored in the end zone", sub: "The crowd goes wild. Gatorade shower. Your bank account is drenched." },
  { emoji: "🏐", headline: "SET. SPIKE. PAYMENT.", sub: "Your transaction just aced the serve. No returns. Match point." },
  { emoji: "🏊", headline: "Your payment just did a perfect swan dive", sub: "10/10 from the judges. Zero splash. Michael Phelps is jealous." },
  { emoji: "🎿", headline: "Downhill payment. No turns. Full speed.", sub: "Olympic gold in Financial Slalom. You didn't even hit a gate." },
  { emoji: "🤸", headline: "Perfect 10 financial gymnastics", sub: "Triple backflip off the balance. Stuck the landing. Simone who?" },
  { emoji: "🏆", headline: "Your payment won the Comrades Marathon", sub: "Longest journey of its life. From your account to theirs. 89km in 2 seconds." },
  { emoji: "🏄", headline: "Surfed that payment wave like J-Bay perfection", sub: "Barrel roll through the banking system. No wipeout. Hang ten." },
  { emoji: "🥇", headline: "Gold medal in the 100m Payment Sprint", sub: "Wayde van Niekerk called. He wants his lane back. Too late. You already finished." },

  // ══════════════════════════════════════
  //  MUSIC & POP CULTURE
  // ══════════════════════════════════════
  { emoji: "🎵", headline: "This payment slaps harder than an amapiano drop", sub: "The 808 kicked. The payment landed. The crowd lost it." },
  { emoji: "🎸", headline: "Your payment just went platinum", sub: "No features. No autotune. Just raw, unfiltered financial excellence." },
  { emoji: "🎹", headline: "More hits than Spotify's top playlist", sub: "Your payment history is basically a greatest hits album." },
  { emoji: "🎤", headline: "Standing ovation from your bank manager", sub: "They stood up. Clapped slowly. Single tear. 'That's my client.'" },
  { emoji: "📻", headline: "Metro FM just played your payment on air", sub: "DJ Fresh voice: 'And that... was the freshest transaction of the day.'" },
  { emoji: "🎧", headline: "Your payment has its own podcast now", sub: "'How I Left A Wallet: A Financial Journey.' Episode 1: The Scan." },
  { emoji: "🎻", headline: "The world's smallest violin played for your wallet", sub: "But the world's biggest celebration happened on the other end." },
  { emoji: "🪕", headline: "Even country music can't tell a sadder story", sub: "Your money left. Your wallet's empty. But you supported a local biz. Happy ending." },

  // ══════════════════════════════════════
  //  GEN Z / MILLENNIAL
  // ══════════════════════════════════════
  { emoji: "💀", headline: "No cap, that payment just ate", sub: "It understood the assignment. Left no crumbs. Period. Slay." },
  { emoji: "🔥", headline: "It's giving... financially responsible", sub: "Not the vibe you expected? Growth doesn't always look glamorous." },
  { emoji: "💅", headline: "Paid and unbothered", sub: "Chaotic neutral energy. You scanned. You conquered. You moved on." },
  { emoji: "🫡", headline: "We're so back", sub: "After 47 failed attempts to find change. We're finally back. QR saved us." },
  { emoji: "✨", headline: "This payment has main character energy", sub: "Walking away in slow motion. Hair blowing. Indie music playing." },
  { emoji: "🧢", headline: "No cap detected in this transaction", sub: "100% real. 100% verified. 100% you being amazing." },
  { emoji: "😭", headline: "Why is this lowkey the best thing I've done today", sub: "Higher than going to gym. Lower than world peace. But solid." },
  { emoji: "🗣️", headline: "Tell the group chat", sub: "They need to know. This payment was elite. Share the screenshot. Flex." },
  { emoji: "⏳", headline: "POV: you just paid without counting coins", sub: "The future is now. Old man coins can't hurt you anymore." },
  { emoji: "🎭", headline: "Ate and left no crumbs", sub: "The payment was served. The vibe was immaculate. The era is cashless." },
  { emoji: "🥶", headline: "That was cold. In a good way.", sub: "Emotionless efficiency. Like a payment assassin. Hitman energy." },

  // ══════════════════════════════════════
  //  MOTIVATIONAL PARODY
  // ══════════════════════════════════════
  { emoji: "🏔️", headline: "Every summit starts with a single scan", sub: "— Ancient QR proverb, probably. We made it up. Still true though." },
  { emoji: "🌅", headline: "Today is the first day of the rest of your payments", sub: "Deep? Maybe. Necessary? Absolutely. Motivational? Debatable." },
  { emoji: "🦁", headline: "Be the lion. But like, a paying lion.", sub: "Lions don't use cash. They scan. Probably. We haven't confirmed with lions." },
  { emoji: "🌊", headline: "Be like water. Flow into this merchant's account.", sub: "Bruce Lee said that. Maybe not the second part. But he'd agree." },
  { emoji: "🪂", headline: "Jump and the net will appear", sub: "We're the net. Your payment is the jump. This metaphor is getting weird. Moving on." },
  { emoji: "🎯", headline: "Bullseye. First try. No notes.", sub: "If paying people was an Olympic sport, you'd be on the podium crying." },
  { emoji: "🌱", headline: "From small scans grow mighty economies", sub: "Every local payment plants a seed. You're basically a farmer now." },
  { emoji: "🧗", headline: "They said it couldn't be done", sub: "They said you'd need cash forever. They said QR was a fad. They were wrong." },
  { emoji: "🕯️", headline: "Be the payment you wish to see in the world", sub: "— Mahatma Gandhi, probably. If he had a smartphone. And a QR code." },
  { emoji: "🦋", headline: "Caterpillar to butterfly. Cash to QR.", sub: "Metamorphosis. Evolution. Your payment just had a spiritual awakening." },

  // ══════════════════════════════════════
  //  ANIMALS
  // ══════════════════════════════════════
  { emoji: "🐕", headline: "Good boy energy: fetched the payment first try", sub: "No drop. No run. Brought it right back. Who's a good payer? You are." },
  { emoji: "🐈", headline: "Your payment had cat energy", sub: "It did what it wanted, when it wanted. Then knocked your balance off the counter." },
  { emoji: "🦩", headline: "Flamingos are pink because of what they eat", sub: "This payment is pink because of how it makes you feel. Fabulous." },
  { emoji: "🐧", headline: "Wrong bird. Don't care. Payment went through.", sub: "Penguins can't fly either but nobody's cancelling them." },
  { emoji: "🦈", headline: "Shark Week: Financial Edition", sub: "Your payment smelled money in the water. Attacked. Done in seconds." },
  { emoji: "🦥", headline: "Faster than a sloth. Which is saying something.", sub: "Actually, way faster. Like comparing a Ferrari to a... sloth." },
  { emoji: "🐝", headline: "Bee-autiful transaction", sub: "Your payment just pollinated a local business. The ecosystem thanks you." },
  { emoji: "🦒", headline: "Your payment stood head and shoulders above the rest", sub: "Like a giraffe at a petting zoo. Impossible to miss. Majestic." },
  { emoji: "🐙", headline: "Octopus energy: 8 arms, all paying at once", sub: "Multi-tasking legend. Your payment was just one of your many talents." },

  // ══════════════════════════════════════
  //  CONSPIRACY & PURE CHAOS
  // ══════════════════════════════════════
  { emoji: "🎪", headline: "And for my next trick", sub: "I will make your money disappear... into a local business. *applause*" },
  { emoji: "🫣", headline: "Your bank account when it sees this", sub: "'Ah here we go again.' Too late. It's done. No refunds on vibes." },
  { emoji: "🦩", headline: "You just made capitalism cute", sub: "A flamingo helped you pay a human. The economy is healing." },
  { emoji: "🎤", headline: "Mic dropped. Payment cleared. Crowd roaring.", sub: "Standing ovation from your bank. Slow clap from your wallet." },
  { emoji: "🦩", headline: "Flam. Ingo. Done.", sub: "Three syllables. One payment. Zero regrets. That's the tweet." },
  { emoji: "🌋", headline: "Your payment just erupted", sub: "Lava-hot execution. The village is destroyed. But financially, everyone's fine." },
  { emoji: "🛸", headline: "Aliens monitoring Earth just saw this", sub: "'They pay each other using bird rectangles?' 'Fascinating species.'" },
  { emoji: "🎰", headline: "Jackpot! Your payment went through!", sub: "The odds were... actually 100%. But let us have this moment." },
  { emoji: "🧲", headline: "Your QR code is magnetically attractive", sub: "Pulling money from accounts like it's got gravitational force." },
  { emoji: "🏴‍☠️", headline: "You just legally pirated this merchant's heart", sub: "They saw the payment notification and got butterflies. This is a love story now." },
  { emoji: "🧬", headline: "Financially evolved", sub: "While others count coins, your DNA mutated to scan QR codes. Darwin is proud." },
  { emoji: "🗿", headline: "Stoic payment energy", sub: "No emotion. Just scan. Just pay. Marcus Aurelius approves from the grave." },
  { emoji: "🦩", headline: "The QR code feared you", sub: "It knew what was coming. It accepted its fate. It processed. GG." },
  { emoji: "🫡", headline: "The National Treasury just slow-clapped", sub: "They've never seen rands move this gracefully. Someone's getting promoted." },
  { emoji: "👽", headline: "Area 51 has no technology this advanced", sub: "They hide aliens. We process payments. Clear winner." },
  { emoji: "🔺", headline: "The Illuminati didn't plan for QR payments", sub: "Their world domination plan was cash-based. You just disrupted the New World Order." },
  { emoji: "🌀", headline: "Your payment entered a wormhole", sub: "It left your account in 2026 and arrived in the merchant's account in... also 2026. But instantly." },
  { emoji: "🧊", headline: "The ice caps are melting but your payment is frozen in perfection", sub: "Climate change can't touch this transaction. It's in a museum now." },
  { emoji: "🎃", headline: "Scariest thing your wallet's seen all year", sub: "Forget Halloween. The QR code just showed up and your balance screamed." },
  { emoji: "🦩", headline: "Big Bird is jealous. Tweety is shook.", sub: "There's a new bird in town. It processes payments. And it's PINK." },
  { emoji: "🧙", headline: "You're a payments wizard, Harry", sub: "No wand needed. Just a phone. And a QR code. Hogwarts didn't teach this." },
  { emoji: "🎲", headline: "RNG blessed this transaction", sub: "Random Number God said 'let this one through.' And it was good." },
  { emoji: "🫧", headline: "This payment was a fever dream", sub: "Did it happen? Is this real? Check your balance. Yeah. It happened." },
  { emoji: "🧸", headline: "Teddy bear market: your money is in safe hands", sub: "Warm. Fuzzy. Protected. Your payment is being cuddled by a local business." },
  { emoji: "🎪", headline: "Ladies and gentlemen, the show is over", sub: "The acrobats have left. The lion tamer bowed. Your payment? Standing ovation." },
  { emoji: "🦩", headline: "Cash didn't die. It was murdered.", sub: "By you. With a QR code. In the spaza shop. Colonel Mustard is impressed." },
  { emoji: "🏛️", headline: "This transaction belongs in a museum", sub: "The Louvre called. They want to hang your receipt next to the Mona Lisa." },
  { emoji: "🛡️", headline: "This payment is now canon", sub: "In the official Flamingo lore, you are chapter 47. A legendary payer." },
];

// ═══════════════════════════════════════════════════════════════
//  FAIL QUOTES — shown when payment fails
// ═══════════════════════════════════════════════════════════════

export const FAIL_QUOTES: ViralQuote[] = [
  // ── SA Flavour ──
  { emoji: "😭", headline: "Your payment is having a gap year", sub: "It'll find itself eventually. Just not right now. Try again." },
  { emoji: "💀", headline: "Transaction said 'I'm deceased'", sub: "We're sending thoughts and prayers. And also a retry button." },
  { emoji: "😤", headline: "Your bank left you on read", sub: "Seen 12:04. No reply. Classic. The audacity of these financial institutions." },
  { emoji: "🧊", headline: "Payment frozen. Blame stage 6.", sub: "Eskom didn't do this. But it's easier to blame them. Try again." },
  { emoji: "📡", headline: "Telkom woke up and chose violence", sub: "We can't prove it was them. But we can't prove it wasn't." },
  { emoji: "🫠", headline: "Payment melted like a Cornetto in December", sub: "Durban heat. No survivors. Try again before your battery also dies." },
  { emoji: "🏚️", headline: "The internet took a lunch break", sub: "South African lunch break. So like 2 hours. But try again now." },
  { emoji: "🔌", headline: "Someone tripped over the cable", sub: "Was it loadshedding? Was it Dave from IT? The investigation continues." },
  { emoji: "🐌", headline: "That payment is moving at SAPO speed", sub: "It'll arrive in 3-5 business forevers. Or just retry now." },
  { emoji: "🚦", headline: "Robot's broken. Nobody's directing traffic.", sub: "Your payment is stuck at the intersection. Honking won't help. Retry will." },
  { emoji: "🏗️", headline: "Under construction, like every road in Joburg", sub: "We apologise for the inconvenience. Estimated completion: nobody knows." },
  { emoji: "🦩", headline: "The flamingo face-planted", sub: "Beak first into the ground. Dignity? Gone. But we're getting up." },
  { emoji: "🫗", headline: "Spilled like a Hunters at a braai", sub: "Wasted potential. But there's more in the cooler. Hit retry." },
  { emoji: "🚰", headline: "Payment went down the drain", sub: "Like water during Joburg water restrictions. Except this you can retry." },
  { emoji: "📦", headline: "Your payment was delivered to the wrong address", sub: "PostNet energy. It's out there somewhere. Let's try sending it again." },
  { emoji: "🚶", headline: "Payment got lost at Bree taxi rank", sub: "Wrong queue. Wrong taxi. But it's still alive. Send it again." },
  { emoji: "🧱", headline: "Your payment hit a pothole on the N1", sub: "Size of a swimming pool. Classic. Nothing Sanral can't ignore." },
  { emoji: "🔥", headline: "Your payment went up in smoke like a braai without firelighters", sub: "No flame. No heat. Just disappointment. But we've got matches now." },

  // ── Celebrity & Pop Culture ──
  { emoji: "🤡", headline: "You've been clowned by technology", sub: "Somewhere, a card machine is laughing. Don't give it the satisfaction." },
  { emoji: "🥲", headline: "Payment ghosted harder than Hinge", sub: "It was right there. We made eye contact. Then poof. Gone. Like everyone on dating apps." },
  { emoji: "🎬", headline: "This is the sad montage part of the movie", sub: "Raining outside. Slow piano. Your payment failed. But the comeback is next scene." },
  { emoji: "🧙", headline: "Not even Dumbledore could fix this", sub: "And he literally came back from the dead. Your payment just needs a retry though." },
  { emoji: "🤔", headline: "Your bank needs a moment", sub: "'I need to speak to my manager' energy. Give it a sec and retry." },
  { emoji: "🫣", headline: "Well this is embarrassing", sub: "For us, not you. You did everything right. We just... flopped." },
  { emoji: "🦩", headline: "Even pink birds have bad days", sub: "But unlike your ex, we're willing to try again. Hit retry." },
  { emoji: "🧠", headline: "Error 404: payment not found", sub: "Your money is safe. The payment just went to get milk and never came back." },
  { emoji: "🦩", headline: "Technical difficulties feat. bad vibes", sub: "The vibes were off. Mercury is in retrograde. Also, try again." },
  { emoji: "🎭", headline: "Shakespeare: 'To pay or not to pay'", sub: "The answer is to pay. But your bank chose violence. Retry and show it who's boss." },
  { emoji: "🦖", headline: "Extinct. Like this payment attempt.", sub: "But dinosaurs can't retry. You can. Evolution wins again." },
  { emoji: "🙃", headline: "Cool cool cool. No payment.", sub: "This is fine. The room is on fire. But your money is safe. So there's that." },
  { emoji: "🦩", headline: "Plot twist nobody asked for", sub: "In the movie of your life, this is the part where the hero retries and succeeds." },
  { emoji: "🎮", headline: "Game over. Insert coin to continue.", sub: "Just kidding. We don't use coins here. Tap retry like a civilised human." },
  { emoji: "📺", headline: "Buffering... like DStv during the final", sub: "The exact worst moment. But unlike DStv, we have a retry button." },
  { emoji: "🏈", headline: "Fumble on the 1-yard line", sub: "So close. So painful. But unlike the Falcons, you get another play." },
  { emoji: "🎵", headline: "DJ played the wrong song at the wedding", sub: "Vibes: killed. Dance floor: empty. But the next track slaps. Hit retry." },
  { emoji: "🧊", headline: "Frozen like Elsa's social skills", sub: "Let it go. Let it gooo. And press that beautiful retry button." },
  { emoji: "💀", headline: "Your payment said 'I don't feel so good, Mr. Stark'", sub: "It crumbled. It dusted. But the Avengers always bring them back. Retry." },
  { emoji: "🫠", headline: "Your payment pulled a Kanye", sub: "Started great. Got weird. Ended badly. But there's always next album. I mean, retry." },
  { emoji: "🎬", headline: "Directed by M. Night Shyamalan", sub: "The twist? The payment was dead the whole time. But plot twist twist: retry works." },
  { emoji: "🤖", headline: "Even robots fail sometimes", sub: "Skynet took over the world but couldn't process this R50 payment. Humbling." },
  { emoji: "🦩", headline: "This is the villain origin story", sub: "First your payment fails. Then you become a supervillain. Or just retry. Either way." },
  { emoji: "🎭", headline: "Tragedy today. Comedy tomorrow.", sub: "Shakespeare wrote about this. Probably. The point is: retry and the joke lands." },
  { emoji: "🧊", headline: "Your payment is in the sunken place", sub: "Get Out reference? Yes. Can your payment get out? Also yes. Press retry." },
  { emoji: "🎪", headline: "The circus is in town and your payment is the clown", sub: "But even clowns get standing ovations. Hit retry for the comeback arc." },
];

// ═══════════════════════════════════════════════════════════════
//  PROCESSING QUIPS — rotate while waiting
// ═══════════════════════════════════════════════════════════════

export const PROCESSING_QUIPS: string[] = [
  "Explaining to your bank why this is a good idea...",
  "Your rands are putting on their running shoes...",
  "Whispering 'it's going to be okay' to your wallet...",
  "Loading... unlike Eskom, we actually finish things.",
  "Teaching your money to do parkour across banks...",
  "Calculating how many vetkoeks that is...",
  "Your bank is Googling 'what is a flamingo'...",
  "Negotiating with the payment gods. They drive a hard bargain.",
  "Your money just said 'goodbye cruel wallet'...",
  "Buffering at the speed of South African wifi...",
  "Drafting a motivational speech for your rands...",
  "Asking your bank nicely. Very nicely. Please.",
  "Your payment is in the uber. 3 min away. Probably.",
  "Converting your money into flamingo energy...",
  "Almost done. We're not Telkom. We promise.",
  "Asking Eskom if we can borrow some power real quick...",
  "Your rands are having a farewell braai in your account...",
  "Loading faster than a government website...",
  "Payment doing the macarena across banking systems...",
  "Your bank is checking with management. Classic.",
  "Rands packing their bags. Destination: local business.",
  "Please hold. Your payment is important to us. Unlike Telkom.",
  "Quick pit stop at the Reserve Bank. Stretching legs.",
  "Downloading more RAM... just kidding. Almost there.",
  "Your money is saying goodbye to its friends in your wallet...",
  "Currently outperforming Eskom's turnaround strategy...",
  "Teaching your rands to swim to the next account...",
  "Bribing the internet to work for 3 more seconds...",
  "Payment in transit. Driving speed limit. Safety first.",
  "Your bank is putting on reading glasses to check this...",
  "Doing the thing. The money thing. Technical term.",
  "ChatGPT couldn't do this faster. Just saying.",
  "Loading at the speed of a Home Affairs queue...",
  "Your payment is choosing an outfit for the arrival...",
  "Heating up the transaction... almost microwave-ready...",
  "Sending your money via the express lane. No trolleys allowed.",
  "Your payment just passed the vibe check...",
  "Consulting the ancestors about this transfer...",
  "Payment is doing that thing where it pretends to be busy...",
  "Speedrunning the South African banking system...",
  "Your payment is at customs. Declaring nothing. Looking suspicious.",
  "Convincing your bank this isn't a scam. It's a flamingo.",
  "Your money is having a last supper in your account...",
  "Currently faster than NSFAS payments. Low bar but still.",
  "Your payment is navigating Joburg traffic. Mentally.",
  "Asking the payment to identify all the traffic lights in the picture...",
  "Your rands are doing that awkward 'you hang up first' thing...",
  "Loading... like a YouTube video on Telkom data.",
  "Your payment is in the WhatsApp typing bubble...",
  "Transferring vibes... and also your money.",
  "Your bank account: 'It's not you, it's me.' Payment: 'IT IS YOU.'",
  "Processing at the speed of a government tender... just kidding, WAY faster.",
  "Your money is stretching before the marathon to the next account...",
  "Mercury is in retrograde but we're pushing through anyway...",
  "Recalculating route... your money took the scenic road.",
  "Warming up the servers... they're cold. It's winter somewhere.",
  "Your payment joined a queue at Home Affairs. Just kidding. Almost done.",
  "Counting your money... R1... R2... just kidding, computers are faster.",
  "Your rands are in the departure lounge. Gate closing soon.",
  "Asking your bank for permission. It's giving side-eye.",
  "Your money is writing a farewell letter to your account...",
  "Currently moving faster than a Joburg Uber driver at 2am...",
  "Your payment is doing push-ups before arrival. Wants to look good.",
  "Making your money feel comfortable about this life change...",
  "Your bank is updating Java. This could take a while. Jk almost done.",
  "Translating your payment into all 11 official languages...",
  "Your payment is at the robot. It just turned green. Go go go.",
];

/** Pick a random item from an array. */
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
