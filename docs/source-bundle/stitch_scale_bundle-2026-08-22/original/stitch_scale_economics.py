from dataclasses import dataclass

@dataclass
class Scenario:
    price: float
    production_cost: float
    payhip_fee: float = 0.05

for cost_name, production_cost in [("simple_accessory", 78), ("typical_sweater", 250), ("complex_multi_size", 500)]:
    print(f"\n{cost_name}: production cost ${production_cost:,.0f}")
    for price in (8, 12, 18):
        net = price * (1 - 0.05)
        break_even = (production_cost / net + 0.999999)//1
        print(f"price ${price}: net before payment processing ${net:.2f}; break-even sales {int(break_even)}")

print("\nTime-value scenarios")
for hours in (20, 40, 80):
    for hourly_rate in (15, 25, 35):
        opportunity = hours * hourly_rate
        print(f"{hours}h at ${hourly_rate}/h = ${opportunity:,.0f}")
