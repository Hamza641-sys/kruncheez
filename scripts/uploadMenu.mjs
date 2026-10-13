// Upload all menu items to Firestore
const API_KEY    = 'AIzaSyC0dgHGMjbWeurlKAGNBakp3R-Eg8EIx7Y';
const PROJECT_ID = 'kruncheez-pos';
const EMAIL      = 'kruncheez.admin@gmail.com';
const PASSWORD   = 'KrunchEez@2024!';

// ── All menu items ─────────────────────────────────────────────────────────
const menuItems = [
  // BURGERS
  { name: 'Zinger Burger',            price: 390,  category: 'burgers',  badge: 'POPULAR',    description: 'Crispy chicken, fresh veggies, creamy sauce',                img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Zinger Burger with Cheese',price: 450,  category: 'burgers',  badge: "CHEF'S PICK",description: 'Classic chicken patty with melted cheese, fresh veggies',      img: 'https://images.unsplash.com/photo-1596956470007-2bf6095e7e16?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Chicken Patty Burger',     price: 340,  category: 'burgers',  badge: '',           description: 'Classic chicken patty with fresh veggies, special sauce',      img: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Parmesan Cheese Burger',   price: 490,  category: 'burgers',  badge: '',           description: 'Grilled chicken, parmesan cheese, lettuce & sauce',            img: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Grill Burger with Cheese', price: 490,  category: 'burgers',  badge: '',           description: 'Grilled chicken, cheese, fresh veggies',                       img: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Tower Burger with Cheese', price: 590,  category: 'burgers',  badge: 'NEW',        description: 'Double stacked tower burger with loaded cheese',               img: 'https://images.unsplash.com/photo-1613769049987-b31b641f25b1?w=400&q=80&auto=format&fit=crop',  available: true },

  // BBQ
  { name: '1 Chicken Piece',          price: 350,  category: 'bbq',      badge: '',           description: 'Tender BBQ grilled chicken piece',                            img: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Chicken Boti Plate',       price: 490,  category: 'bbq',      badge: '',           description: 'Juicy chicken boti served with raita & salad',                img: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Malai Boti Plate',         price: 550,  category: 'bbq',      badge: 'POPULAR',    description: 'Creamy malai boti with soft texture',                         img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Achari Boti',              price: 490,  category: 'bbq',      badge: '',           description: 'Tangy achari marinated chicken boti',                         img: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Beef Tikka Plate',         price: 650,  category: 'bbq',      badge: '',           description: 'Tender beef tikka with special spices',                       img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Beef Kabab Plate',         price: 600,  category: 'bbq',      badge: '',           description: 'Juicy beef kabab with mint chutney',                          img: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Reshmi Kabab Plate',       price: 550,  category: 'bbq',      badge: '',           description: 'Silky smooth reshmi kabab',                                   img: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Karachi Angara (Spicy)',   price: 1500, category: 'bbq',      badge: 'SPICY',      description: 'Fiery karachi style angara',                                  img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'White Chicken Angara',     price: 1600, category: 'bbq',      badge: '',           description: 'White marinated angara chicken',                              img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Bater (1 Piece)',          price: 150,  category: 'bbq',      badge: '',           description: 'Crispy grilled quail',                                        img: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Grill Fish',               price: 950,  category: 'bbq',      badge: '',           description: 'Fresh grilled fish with herbs',                               img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Kabli Pulao',              price: 600,  category: 'bbq',      badge: '',           description: 'Fragrant Kabli pulao',                                        img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Raita',                    price: 100,  category: 'bbq',      badge: '',           description: 'Fresh yogurt raita',                                          img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Salad',                    price: 100,  category: 'bbq',      badge: '',           description: 'Fresh garden salad',                                          img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80&auto=format&fit=crop',  available: true },

  // WRAPS & ROLLS
  { name: 'Chicken Shawarma',         price: 230,  category: 'wraps',    badge: '',           description: 'Classic chicken shawarma wrap',                               img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Special Shawarma',         price: 350,  category: 'wraps',    badge: 'POPULAR',    description: 'Loaded special shawarma with extra fillings',                 img: 'https://images.unsplash.com/photo-1619647548731-7f5ea71b8a89?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Classic Chicken Wrap',     price: 350,  category: 'wraps',    badge: '',           description: 'Simple crispy chicken wrap',                                  img: 'https://images.unsplash.com/photo-1550461716-dbf266b2a8a7?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Mexican Chicken Wrap',     price: 390,  category: 'wraps',    badge: '',           description: 'Spicy Mexican-style chicken wrap',                            img: 'https://images.unsplash.com/photo-1584208124888-6c43e0f47b2f?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Chicken Paratha Roll',     price: 350,  category: 'wraps',    badge: '',           description: 'Classic desi chicken paratha roll',                           img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Zinger Paratha Roll',      price: 390,  category: 'wraps',    badge: '',           description: 'Crispy zinger in paratha roll',                               img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Twister Roll',             price: 390,  category: 'wraps',    badge: '',           description: 'Twisted crispy chicken roll',                                 img: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Behari Roll',              price: 450,  category: 'wraps',    badge: '',           description: 'Tender behari kabab roll',                                    img: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Afghani Special Roll',     price: 550,  category: 'wraps',    badge: 'SPECIAL',    description: 'Rich Afghani marinated chicken roll',                         img: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80&auto=format&fit=crop',  available: true },

  // PIZZA
  { name: 'Chicken Tikka BBQ',        price: 599,  category: 'pizza',    badge: 'POPULAR',    description: 'Smoky chicken tikka with BBQ sauce',                          img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Chicken Fajita',           price: 599,  category: 'pizza',    badge: '',           description: 'Mexican-style chicken fajita pizza',                          img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Chicken Supreme',          price: 599,  category: 'pizza',    badge: '',           description: 'Supreme loaded chicken pizza',                                img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Hot & Spicy',              price: 599,  category: 'pizza',    badge: 'SPICY',      description: 'Fiery hot & spicy chicken pizza',                             img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Classic Peproni',          price: 599,  category: 'pizza',    badge: '',           description: 'Classic pepperoni loaded pizza',                              img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Creamy Mint',              price: 699,  category: 'pizza',    badge: '',           description: 'Unique creamy mint chicken pizza',                            img: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Cheesy Stuff Crust',       price: 1299, category: 'pizza',    badge: '',           description: 'Loaded cheese stuffed crust pizza',                           img: 'https://images.unsplash.com/photo-1548369937-47519962c11a?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Chicken Stuff Crust',      price: 1299, category: 'pizza',    badge: '',           description: 'Chicken stuffed crust pizza',                                 img: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Crown Crust',              price: 1299, category: 'pizza',    badge: '',           description: 'Crown crust loaded pizza',                                    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Rabab Crust',              price: 1299, category: 'pizza',    badge: '',           description: 'Special Rabab crust pizza',                                   img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Double Stuff',             price: 1299, category: 'pizza',    badge: '',           description: 'Double stuffed loaded pizza',                                 img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Meat Feast',               price: 1350, category: 'pizza',    badge: 'TOP TRENDING',description: 'Loaded meat feast signature pizza',                         img: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Asian Style',              price: 1350, category: 'pizza',    badge: 'TOP TRENDING',description: 'Asian fusion style pizza',                                  img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'KrunchEez Special',        price: 1350, category: 'pizza',    badge: 'SIGNATURE',  description: 'Our very own signature special pizza',                        img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: '4 Season',                 price: 1350, category: 'pizza',    badge: '',           description: '4 season loaded classic pizza',                               img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Kebab Della',              price: 1350, category: 'pizza',    badge: '',           description: 'Kebab-loaded Della style pizza',                              img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80&auto=format&fit=crop',  available: true },

  // CHINESE
  { name: 'Chicken Chowmein',         price: 590,  category: 'chinese',  badge: 'POPULAR',    description: 'Wok-fired chicken chowmein noodles',                          img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Vegetable Chowmein',       price: 490,  category: 'chinese',  badge: '',           description: 'Fresh vegetable stir-fry noodles',                            img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Special Chowmein',         price: 690,  category: 'chinese',  badge: 'SPECIAL',    description: 'Special loaded chowmein with extra toppings',                 img: 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Egg Fried Rice',           price: 490,  category: 'chinese',  badge: '',           description: 'Wok-fried egg rice',                                          img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Special Fried Rice',       price: 590,  category: 'chinese',  badge: '',           description: 'Special loaded fried rice',                                   img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80&auto=format&fit=crop',  available: true },

  // PASTA
  { name: 'Fettucine Alfredo Pasta',  price: 690,  category: 'pasta',    badge: '',           description: 'Creamy Alfredo fettucine pasta',                              img: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Oven Baked Pasta',         price: 850,  category: 'pasta',    badge: 'POPULAR',    description: 'Rich oven-baked pasta with cheese',                           img: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Chicken Lasagne (Reg)',    price: 590,  category: 'pasta',    badge: '',           description: 'Classic chicken lasagne',                                     img: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Chicken Lasagne (Large)',  price: 890,  category: 'pasta',    badge: '',           description: 'Large serving of chicken lasagne',                            img: 'https://images.unsplash.com/photo-1539136788836-5699e78bfc75?w=400&q=80&auto=format&fit=crop',  available: true },

  // STARTERS
  { name: "Vegas Nacho's",            price: 499,  category: 'starters', badge: '',           description: 'Crispy nachos with cheese dip',                               img: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Fish & Chips',             price: 499,  category: 'starters', badge: '',           description: 'Golden fried fish with chips',                                img: 'https://images.unsplash.com/photo-1579252587997-f8d52e2c3fc3?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Finger Fish (with Fries)', price: 399,  category: 'starters', badge: '',           description: 'Crispy finger fish served with fries',                        img: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Super Chilli Wings (4pcs)',price: 499,  category: 'starters', badge: 'SPICY',      description: 'Super hot chilli wings',                                      img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Super Chilli Wings (8pcs)',price: 799,  category: 'starters', badge: 'SPICY',      description: 'Super hot chilli wings large portion',                        img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Crispy Wings (4pcs)',      price: 459,  category: 'starters', badge: '',           description: 'Crispy golden chicken wings',                                 img: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Crispy Wings (8pcs)',      price: 679,  category: 'starters', badge: '',           description: 'Crispy golden wings large',                                   img: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'BBQ Wings (4pcs)',         price: 499,  category: 'starters', badge: '',           description: 'BBQ glazed chicken wings',                                    img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'BBQ Wings (8pcs)',         price: 799,  category: 'starters', badge: '',           description: 'BBQ glazed wings large',                                      img: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Chicken Strips (with Fries)',price:499, category: 'starters', badge: 'POPULAR',    description: 'Crispy chicken strips with fries',                            img: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Chicken Nuggets (with Fries)',price:399,category: 'starters', badge: '',           description: 'Juicy nuggets with fries',                                    img: 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Loaded Fries (BBQ)',       price: 450,  category: 'starters', badge: '',           description: 'Loaded fries with BBQ sauce',                                 img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Plain Fries (BBQ)',        price: 200,  category: 'starters', badge: '',           description: 'Plain crispy fries',                                          img: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Plain Fries (Large)',      price: 300,  category: 'starters', badge: '',           description: 'Large plain crispy fries',                                    img: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400&q=80&auto=format&fit=crop',  available: true },

  // SANDWICH
  { name: 'Club Sandwich',            price: 399,  category: 'sandwich', badge: '',           description: 'Classic triple-layer club sandwich',                          img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Grill Sandwich',           price: 499,  category: 'sandwich', badge: 'POPULAR',    description: 'Hot grilled cheese sandwich',                                 img: 'https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Pakoran Sandwich',         price: 750,  category: 'sandwich', badge: '',           description: 'Desi pakora-style sandwich',                                  img: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Euro Sandwich',            price: 750,  category: 'sandwich', badge: '',           description: 'European-style loaded sandwich',                              img: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&q=80&auto=format&fit=crop',  available: true },

  // FRIED CHICKEN
  { name: '1 Chicken Piece',          price: 280,  category: 'chicken',  badge: '',           description: 'Crispy golden fried chicken piece',                           img: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: '2 Chicken Pieces',         price: 499,  category: 'chicken',  badge: '',           description: '2 crispy golden fried chicken pieces',                        img: 'https://images.unsplash.com/photo-1569591159212-b02ea8a9f239?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: '4 Chicken Pieces',         price: 950,  category: 'chicken',  badge: 'POPULAR',    description: '4 crispy golden fried chicken pieces',                        img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: '8 Chicken Pieces',         price: 1799, category: 'chicken',  badge: 'FAMILY',     description: '8 crispy golden fried chicken pieces',                        img: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80&auto=format&fit=crop',  available: true },

  // SOUP
  { name: 'Chicken Corn Soup (Single)',price:299,  category: 'soup',     badge: '',           description: 'Warm chicken corn soup single serving',                       img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Chicken Corn Soup (Family)',price:550,  category: 'soup',     badge: '',           description: 'Warm chicken corn soup family serving',                       img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Hot & Sour Soup (Single)', price: 299,  category: 'soup',     badge: '',           description: 'Tangy hot & sour soup single serving',                        img: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Hot & Sour Soup (Family)', price: 550,  category: 'soup',     badge: '',           description: 'Tangy hot & sour soup family serving',                        img: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'KrunchEez Special Soup (Single)',price:399,category:'soup',   badge: 'SPECIAL',    description: 'Our signature special soup',                                  img: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'KrunchEez Special Soup (Family)',price:650,category:'soup',   badge: 'SPECIAL',    description: 'Our signature special soup family size',                      img: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=400&q=80&auto=format&fit=crop',  available: true },

  // PLATTERS
  { name: 'Platter 1 Person',         price: 600,  category: 'platter',  badge: '',           description: 'Chicken Boti, Malai Boti, Reshmi Kabab, Pulao, Raita, Salad, Regular Drink',  img: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Platter 2 Person',         price: 1190, category: 'platter',  badge: 'POPULAR',    description: '1 Chicken, Malai Boti, Beef Kabab, Reshmi Kabab, Pulao, Raita, Salad, Drink', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Platter 4 Person',         price: 4000, category: 'platter',  badge: '',           description: 'Half Angara, Malai Boti, Tikka, Kabab, Reshmi Kabab, Fish, Pulao, Raita, Drink', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Platter 8 Person',         price: 6500, category: 'platter',  badge: 'FAMILY FEAST',description: 'Full Angara, Malai Boti, Tikka, Kabab, Bater, Pulao, Salad, Raita, Drink',  img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80&auto=format&fit=crop',  available: true },

  // DEALS
  { name: 'Deal 1',                   price: 590,  category: 'deals',    badge: 'BEST VALUE', description: 'Zinger Burger + Regular Fries + Regular Drink',               img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Deal 2',                   price: 1190, category: 'deals',    badge: '',           description: 'Small Pizza + 5 Hot Wings + Regular Fries + Sting',           img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Deal 3',                   price: 1350, category: 'deals',    badge: '',           description: 'Classic Wrap + Paratha Roll + 10 Hot Wings + 1 Ltr Drink',   img: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Deal 4',                   price: 1720, category: 'deals',    badge: '',           description: '2 Zinger + 2 Shawarma + 2 Chicken Piece + 1 Ltr Drink',      img: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Deal 5',                   price: 2450, category: 'deals',    badge: 'POPULAR',    description: 'Medium Pizza + 2 Zinger + 10 Hot Wings + 1.5 Ltr Drink',     img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Deal 6',                   price: 2650, category: 'deals',    badge: '',           description: '1 Large Pizza + 4 Chicken + 4 Strip + 1.5 Ltr Drink',        img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Deal 7',                   price: 3300, category: 'deals',    badge: '',           description: '4 Zinger + Loaded Fries + 10 Wings + Wrap + Roll + 1.5L Drink', img: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Deal 8',                   price: 1650, category: 'deals',    badge: '',           description: '3 Small Pizza + 1 Ltr Drink',                                 img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Deal 9',                   price: 2950, category: 'deals',    badge: '',           description: '3 Medium Pizza + 1.5 Ltr Drink',                              img: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=400&q=80&auto=format&fit=crop',  available: true },
  { name: 'Deal 10',                  price: 3800, category: 'deals',    badge: 'MEGA DEAL',  description: '3 Large Pizza + 1.5 Ltr Drink',                               img: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80&auto=format&fit=crop',  available: true },
];

// ── Sign in to get auth token ──────────────────────────────────────────────
async function signIn() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.idToken;
}

// ── Upload one item to Firestore ───────────────────────────────────────────
async function uploadItem(item, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/menu`;
  const body = {
    fields: {
      name:        { stringValue: item.name },
      price:       { integerValue: String(item.price) },
      category:    { stringValue: item.category },
      badge:       { stringValue: item.badge || '' },
      description: { stringValue: item.description },
      img:         { stringValue: item.img },
      available:   { booleanValue: item.available },
    }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data;
}

// ── Main ───────────────────────────────────────────────────────────────────
(async () => {
  console.log('🔐 Signing in...');
  const idToken = await signIn();
  console.log('✅ Signed in!\n');

  console.log(`📤 Uploading ${menuItems.length} menu items to Firestore...\n`);

  let success = 0;
  let failed  = 0;

  for (const item of menuItems) {
    try {
      await uploadItem(item, idToken);
      console.log(`✅ ${item.category.toUpperCase()} → ${item.name}`);
      success++;
    } catch (err) {
      console.log(`❌ Failed: ${item.name} — ${err.message}`);
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉 DONE! ${success} items uploaded, ${failed} failed`);
  console.log('🌐 Check: https://kruncheez-pos.web.app/admin/menu');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
})();
