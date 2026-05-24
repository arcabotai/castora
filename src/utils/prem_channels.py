import csv
import os
import json

# get the path to the downloads folder
downloads_path = os.path.expanduser('~/Downloads')

# get the path to the csv file
csv_file = os.path.join(downloads_path, 'permissionless_channels.csv')

# create a json file that will be used to store the data
json_file = os.path.join(downloads_path, 'prem_channels.json')

# open the csv file
with open(csv_file, 'r') as f:
    # create a csv reader object
    csv_reader = csv.reader(f)
    # loop through each row in the csv file
    for row in csv_reader:
        new_row = {
            "name": row[0],
            "parent_url": row[1],
            "image": "",
            "channel_id": row[0]
        }
        # save the data to the json file
        with open(json_file, 'a') as f:
            f.write(json.dumps(new_row) + ',\n')