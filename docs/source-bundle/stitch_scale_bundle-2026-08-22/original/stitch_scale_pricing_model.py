plans = {
    'pay_per_export': 7.99,
    'annual_hobbyist': 39.00,
    'monthly_hobbyist': 4.99 * 12,
    'creator_monthly': 19.00 * 12,
    'creator_annual': 149.00,
}
project_counts = [1, 3, 6, 12]
for name, annual_cost in plans.items():
    print(f'\n{name}: annual cash cost at stated use')
    for n in project_counts:
        if name == 'pay_per_export':
            cost = annual_cost * n
        else:
            cost = annual_cost
        print(f'  {n} projects/year: ${cost:.2f} total; ${cost/n:.2f} per project')

print('\nIllustrative creator-plan revenue')
for paid_users in [50, 100, 250, 500]:
    print(f'  {paid_users} creator users at $19/month: ${paid_users*19:,.0f} MRR; ${paid_users*19*12:,.0f} ARR')
