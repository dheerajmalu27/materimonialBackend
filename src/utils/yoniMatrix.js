const matrix = {
  Horse: { Horse:4, Elephant:3, Sheep:2, Serpent:1, Dog:2, Cat:2, Rat:1, Cow:3, Buffalo:3, Tiger:1, Deer:2, Monkey:2, Mongoose:1, Lion:1 },
  Elephant: { Horse:3, Elephant:4, Sheep:2, Serpent:2, Dog:2, Cat:1, Rat:1, Cow:3, Buffalo:3, Tiger:1, Deer:2, Monkey:2, Mongoose:1, Lion:1 },
  Sheep: { Sheep:4, Horse:2, Elephant:2, Serpent:2, Dog:2, Cat:2, Rat:2, Cow:3, Buffalo:3, Tiger:1, Deer:2, Monkey:2, Mongoose:2, Lion:1 },
  Serpent: { Serpent:4, Mongoose:0, Horse:1, Elephant:2, Sheep:2, Dog:1, Cat:2, Rat:1, Cow:2, Buffalo:2, Tiger:1, Deer:2, Monkey:2, Lion:1 },
  Dog: { Dog:4, Cat:1, Horse:2, Elephant:2, Sheep:2, Serpent:1, Rat:2, Cow:2, Buffalo:2, Tiger:1, Deer:2, Monkey:2, Mongoose:1, Lion:1 },
  Cat: { Cat:4, Rat:0, Dog:1, Horse:2, Elephant:1, Sheep:2, Serpent:2, Cow:2, Buffalo:2, Tiger:1, Deer:2, Monkey:2, Mongoose:2, Lion:1 },
  Rat: { Rat:4, Cat:0, Dog:2, Horse:1, Elephant:1, Sheep:2, Serpent:1, Cow:2, Buffalo:2, Tiger:1, Deer:2, Monkey:2, Mongoose:1, Lion:1 },
  Cow: { Cow:4, Buffalo:3, Horse:3, Elephant:3, Sheep:3, others:2 },
  Buffalo: { Buffalo:4, Cow:3 },
  Tiger: { Tiger:4, Deer:1 },
  Deer: { Deer:4, Tiger:1 },
  Monkey: { Monkey:4 },
  Mongoose: { Mongoose:4, Serpent:0 },
  Lion: { Lion:4 }
};

export default matrix;
