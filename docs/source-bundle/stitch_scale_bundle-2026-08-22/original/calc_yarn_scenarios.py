projects = {
    'hat': (200, 225),
    'scarf': (275, 375),
    'adult sweater': (1125, 1625),
    'baby blanket': (1000, 1125),
    'afghan': (2250, 3125),
}
prices = {'budget acrylic': 4.18, 'midrange': 7.00, 'premium': 15.00}
yards_per_skein = 364
for name, (low, high) in projects.items():
    skeins_low = (low + yards_per_skein - 1) // yards_per_skein
    skeins_high = (high + yards_per_skein - 1) // yards_per_skein
    print(name, skeins_low, skeins_high, {k: (round(skeins_low*v,2), round(skeins_high*v,2)) for k,v in prices.items()})

for skeins in [1,2,3,4,5,6,8]:
    print('shopping_trip', skeins, {k: round(skeins*v,2) for k,v in prices.items()})
