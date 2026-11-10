/* ==========================================================================
   seed/content.js — page copy that is NOT a CRUD collection.

   Products, open jobs and team members live in their own PostgreSQL
   tables (see seed/admin.js) — the single source of truth shared by the
   admin console and the public site. This file only seeds the remaining
   page copy: navigation/footer, flavour callouts, story, recipes, stores,
   contact copy, careers intro copy, and the founder block fallback.

   Imported by db/migrate.js and inserted into the `content` table with a
   merge-on-conflict rule (keys already present always win).
   ========================================================================== */

export default {
  "site": {
    "FOOTER": {
      "blurb": "Crafted with bold flavors, premium ingredients, and unforgettable crunch.",
      "socials": [
        "facebook",
        "instagram",
        "twitter",
        "youtube"
      ],
      "columns": [
        {
          "title": "Products",
          "links": [
            {
              "label": "Classic Flavors",
              "to": "/flavors"
            },
            {
              "label": "Spicy Collection",
              "to": "/flavors"
            },
            {
              "label": "Cheesy Delights",
              "to": "/flavors"
            },
            {
              "label": "Healthy Options",
              "to": "/stores"
            },
            {
              "label": "Limited Edition",
              "to": "/stores"
            }
          ]
        },
        {
          "title": "About Us",
          "links": [
            {
              "label": "Our Story",
              "to": "/about"
            },
            {
              "label": "Quality Promise",
              "to": "/about"
            },
            {
              "label": "Sustainability",
              "to": "/about"
            },
            {
              "label": "Careers",
              "to": "/jobs"
            }
          ]
        },
        {
          "title": "Support",
          "links": [
            {
              "label": "Contact Us",
              "to": "/contact"
            },
            {
              "label": "FAQs",
              "to": "/contact#faq"
            },
            {
              "label": "Shipping Info",
              "to": "/contact"
            },
            {
              "label": "Returns",
              "to": "/contact"
            }
          ]
        }
      ],
      "copyright": "2026 CRISPO. All Rights Reserved."
    },
    "NAV": [
      {
        "label": "Flavors",
        "to": "/flavors"
      },
      {
        "label": "About",
        "to": "/about"
      },
      {
        "label": "Stores",
        "to": "/stores"
      },
      {
        "label": "Recipes",
        "to": "/recipes"
      },
      {
        "label": "Careers",
        "to": "/jobs"
      },
      {
        "label": "Contact",
        "to": "/contact"
      }
    ]
  },
  "flavors": {
    "FEATURES": [
      {
        "icon": "medal",
        "title": "Premium Ingredients",
        "text": "Only high-quality potatoes & natural seasonings."
      },
      {
        "icon": "truck",
        "title": "Fast Delivery",
        "text": "Fresh crunch delivered to your doorstep."
      },
      {
        "icon": "heart",
        "title": "Loved Nationwide",
        "text": "Trusted by thousands of snack lovers."
      }
    ],
    "FLAVOR_POINTS": [
      "Pure crunch with perfectly balanced salt.",
      "A bold, fiery blend that excites your taste buds.",
      "Creamy, rich cheese in every crispy bite.",
      "Smooth, tangy flavor with a savory twist."
    ],
    "TESTIMONIALS": [
      {
        "name": "Sarah Mitchell",
        "role": "Food Blogger",
        "avatar": "/avatar-sarah.jpg",
        "quote": "CRISPO chips are absolutely amazing! The BBQ flavor is my go-to snack. Perfect crunch every time!"
      },
      {
        "name": "Michael Chen",
        "role": "Snack Enthusiast",
        "avatar": "/avatar-michael.jpg",
        "quote": "I've tried every flavor and they're all incredible. The spicy jalapeño is a game-changer!"
      },
      {
        "name": "Emma Rodriguez",
        "role": "Fitness Coach",
        "avatar": "/avatar-emma.jpg",
        "quote": "Finally, a chip brand that uses quality ingredients! The veggie delight is my healthy snack choice!"
      }
    ]
  },
  "about": {
    "STATS": [
      {
        "value": "6",
        "label": "Signature flavors"
      },
      {
        "value": "100%",
        "label": "Natural seasonings"
      },
      {
        "value": "24h",
        "label": "Dispatch on every order"
      },
      {
        "value": "5.0",
        "label": "Average bag rating"
      }
    ],
    "STORY_POINTS": [
      "Whole potatoes, never reconstituted mash.",
      "Seasoned with real spices and cold-pressed oils.",
      "Fried in small batches for an even, golden crunch.",
      "Packed the same day it leaves the kitchen."
    ],
    "VALUES": [
      "No artificial colors or preservatives.",
      "Sourced from growers we know by name.",
      "Less packaging, more crunch per bag.",
      "Priced so a family bag stays affordable."
    ]
  },
  "recipes": {
    "RECIPES": [
      {
        "title": "Loaded Crunch Nachos",
        "description": "A shareable tray of crisp chips loaded with cheese, salsa and a fiery drizzle.",
        "image": "/product-truffle-parmesan.jpg",
        "time": "15 min",
        "servings": "4",
        "level": "Easy",
        "ingredients": [
          "Crispo Truffle Parmesan chips",
          "120g grated cheddar",
          "Salsa & sour cream",
          "Spring onion & chilli flakes"
        ],
        "steps": [
          "Spread the salsa over a large tray and layer the chips on top.",
          "Scatter over the cheese and toast under a hot grill for 4 minutes.",
          "Finish with sour cream, spring onion and chilli flakes."
        ]
      },
      {
        "title": "Smoky Chicken Bites",
        "description": "Crispy coated bites with a smoky dip, built for game night.",
        "image": "/product-arbys.jpg",
        "time": "30 min",
        "servings": "4",
        "level": "Easy",
        "ingredients": [
          "Crispo Roast Beef and Cheddar",
          "450g chicken breast, cubed",
          "2 eggs & 100g flour",
          "Smoked paprika aioli"
        ],
        "steps": [
          "Season the chicken and pass it through flour, egg, then flour again.",
          "Bake at 200°C for 12 minutes until golden and crisp.",
          "Crush the chips over the aioli and serve alongside the bites."
        ]
      },
      {
        "title": "Sweet Chilli Fritters",
        "description": "Golden fritters with a teriyaki-style dip that disappears fast.",
        "image": "/product-pineapple-teriyako.jpg",
        "time": "25 min",
        "servings": "6",
        "level": "Medium",
        "ingredients": [
          "Crispo Pineapple Teriyako",
          "2 cups cooked rice",
          "100g peas & grated carrot",
          "Sesame teriyaki dip"
        ],
        "steps": [
          "Mash the cooled rice with the vegetables and a beaten egg.",
          "Shape into small fritters and shallow fry until crisp.",
          "Serve warm with teriyaki dip and sesame seeds."
        ]
      },
      {
        "title": "Garden Herb Salad",
        "description": "A lighter bowl that keeps the crunch while adding fresh greens.",
        "image": "/product-black-eyed-peas.jpg",
        "time": "10 min",
        "servings": "2",
        "level": "Easy",
        "ingredients": [
          "Crispo Black Eyed Peas",
          "Mixed leaves & cucumber",
          "Lemon, olive oil & herbs",
          "Crumbled feta"
        ],
        "steps": [
          "Whisk the dressing and toss with the leaves and cucumber.",
          "Crumble the chips over the top so they stay crisp.",
          "Finish with feta, cracked pepper and a squeeze of lemon."
        ]
      },
      {
        "title": "Creamy Potato Bake",
        "description": "Chips layered into a golden, herby bake for a Sunday table.",
        "image": "/product-lays.jpg",
        "time": "55 min",
        "servings": "6",
        "level": "Medium",
        "ingredients": [
          "Crispo Cream and Onion",
          "600ml cream & 1 garlic clove",
          "Grated mozzarella & thyme",
          "Chopped spring onion"
        ],
        "steps": [
          "Simmer the cream with garlic and thyme, then strain.",
          "Layer chips, cheese and cream sauce twice in a baking dish.",
          "Bake at 190°C for 35 minutes until golden and bubbling."
        ]
      },
      {
        "title": "Cottage Dip Board",
        "description": "Creamy dip, crunchy shards and crackers for a light evening plate.",
        "image": "/product-cottage-cheese.jpg",
        "time": "8 min",
        "servings": "4",
        "level": "Easy",
        "ingredients": [
          "Crispo Cottage Cheese chips",
          "200g whipped cottage cheese",
          "Lemon zest & cracked pepper",
          "Crackers and carrot sticks"
        ],
        "steps": [
          "Whisk the cottage cheese with lemon zest, salt and pepper.",
          "Let it chill for 20 minutes so the flavor settles.",
          "Serve in a bowl surrounded by chips and crunch vegetables."
        ]
      }
    ]
  },
  "stores": {
    "STORES": [
      {
        "name": "Crispo Market Hall",
        "address": "14 Harbour Street, Dockside",
        "hours": "Mon–Sun · 9:00 – 20:00"
      },
      {
        "name": "The Corner Pantry",
        "address": "82 Alder Road, Northbank",
        "hours": "Mon–Sat · 8:00 – 21:00"
      },
      {
        "name": "Crunch & Co.",
        "address": "5 Lantern Square, Old Town",
        "hours": "Tue–Sun · 10:00 – 22:00"
      },
      {
        "name": "Greenleaf Grocers",
        "address": "310 Meadow Lane, Westfield",
        "hours": "Mon–Sun · 7:00 – 19:00"
      },
      {
        "name": "The Snack Bar",
        "address": "27 Pier Road, Harbour East",
        "hours": "Daily · 11:00 – 23:00"
      },
      {
        "name": "Harvest Foods",
        "address": "96 Orchard Way, Riverton",
        "hours": "Mon–Sat · 9:00 – 18:00"
      }
    ]
  },
  "contact": {
    "CONTACT_CHANNELS": [
      {
        "icon": "phone",
        "title": "Call us",
        "text": "+1 (555) 019-4422",
        "note": "Mon–Fri, 9:00 – 18:00"
      },
      {
        "icon": "mail",
        "title": "Email us",
        "text": "hello@crispo.example",
        "note": "Replies within one business day"
      },
      {
        "icon": "pin",
        "title": "Visit us",
        "text": "14 Harbour Street, Dockside",
        "note": "Tasting counter open daily"
      },
      {
        "icon": "clock",
        "title": "Support hours",
        "text": "Mon–Sat · 9:00 – 20:00",
        "note": "Closed on public holidays"
      }
    ],
    "FAQ": [
      {
        "q": "How fast do orders arrive?",
        "a": "Bags leave the kitchen within 24 hours and typically arrive in 2–4 working days depending on your location."
      },
      {
        "q": "Do you offer bulk orders?",
        "a": "Yes. Office, event and catering bundles start at 20 bags. Use the form above and pick \"Bulk order\" so the right team replies."
      },
      {
        "q": "Are the seasonings natural?",
        "a": "Every flavor is seasoned with real spices, cold-pressed oils and no artificial colors or preservatives."
      },
      {
        "q": "Can I stock Crispo in my store?",
        "a": "Absolutely. Send us a message with your shop details and we will share the wholesale price list."
      }
    ],
    "PROMISES": [
      "Bulk and catering orders from 20 bags",
      "Wholesale list for shops and stockists",
      "Press and collaboration requests"
    ],
    "TOPICS": [
      "General question",
      "Bulk order",
      "Wholesale / stockist",
      "Order status",
      "Press & collaborations"
    ]
  },
  "jobs": {
    "EXPERIENCE": [
      "No experience needed",
      "1 – 2 years",
      "3 – 5 years",
      "6 – 10 years",
      "10+ years"
    ],
    "CAREERS_BENEFITS": [
      {
        "icon": "bowl",
        "title": "A bag every week",
        "text": "Freshly packed, straight off the line."
      },
      {
        "icon": "leaf",
        "title": "Food safety training",
        "text": "Certified, paid for, and fully on the clock."
      },
      {
        "icon": "calendar",
        "title": "Real holiday",
        "text": "Paid leave plus bank holidays off."
      },
      {
        "icon": "heart",
        "title": "Private health cover",
        "text": "From day one, for every full-time role."
      },
      {
        "icon": "spark",
        "title": "Profit share",
        "text": "A slice of the year the company had a good one."
      },
      {
        "icon": "users",
        "title": "Paid volunteering",
        "text": "One day a year, on the company."
      }
    ],
    "CAREERS_POINTS": [
      {
        "icon": "bowl",
        "title": "You make the actual thing",
        "text": "Not a slide about the actual thing. Your hands are on the line that ships."
      },
      {
        "icon": "users",
        "title": "A kitchen, not a cubicle",
        "text": "Small team, flat structure, and the person who fixed it gets the credit."
      },
      {
        "icon": "spark",
        "title": "We taste things for a living",
        "text": "It is a strange job. We do not recommend it to anyone who wants a quiet one."
      },
      {
        "icon": "heart",
        "title": "Benefits that matter",
        "text": "Free bags, real meals on shift, profit share and paid training."
      }
    ]
  },
  "team": {
    "OWNER": {
      "name": "Elena Marsh",
      "role": "Founder & Head of Flavour",
      "initials": "EM",
      "photo": null,
      "bio": "Elena started Crispo in 2019 after twenty years in food development, convinced that a bag of crisps could be made with the same care as a restaurant plate. She still walks the production floor every morning before the first fryer batch goes in.",
      "quote": "We never rush a fryer. If the oil temperature drops for a single minute, we throw that batch out and start again — that is the whole recipe.",
      "credentials": [
        {
          "icon": "medal",
          "label": "20 years in food R&D"
        },
        {
          "icon": "calendar",
          "label": "Founded Crispo in 2019"
        },
        {
          "icon": "spark",
          "label": "6 signature flavors shipped"
        }
      ]
    }
  }
};
