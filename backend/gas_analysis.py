import json

# Load the JSON data from the file
with open('gas_analysis.json') as json_file:
    data = json.load(json_file)

# Multiply the value of the "counterattack" field by 62 for normal size match
normal_size_check_and_attack = data['counterattack'] * 62

# Multiply the value of the "counterattack" field by a different value for small size match
small_size_check_and_attack = data['counterattack'] * 14

# Update the value of the function that are called by both the players
data['proposeBet'] = data['proposeBet'] * 2
data['depositFund'] = data['depositFund'] * 2
data['commitBoard'] = data['commitBoard'] * 2

# Update the value of "counterattack" in the data dictionary
data['counterattack'] = normal_size_check_and_attack

# Sum all the fields for normal size match
total_sum_normal_size = sum(data.values())

# Update the value of "counterattack" in the data dictionary
data['counterattack'] = small_size_check_and_attack

# Sum all the fields for small size match
total_sum_small_size = sum(data.values())

# Print the gas consumed for a normal size match and small size match
print("Gas consumed for a normal size match with 108 misses:", total_sum_normal_size)
print("Gas consumed for a small size match with 22 misses:", total_sum_small_size)
