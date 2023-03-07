import csv
import requests
import os
import sys

if len(sys.argv) != 2:
    print('Usage: {0} <prometheus_url>'.format(sys.argv[0]))
    sys.exit(1)


def get_metrix_names(url):
    resp = requests.get('{0}/api/v1/label/__name__/values'.format(url))
    names = resp.json()['data']

    return names

exclude = [
    "scrape_duration_seconds",
    "scrape_samples_post_metric_relabeling",
    "scrape_samples_scraped",
    "scrape_series_added",
    "up"
]

queryURL = sys.argv[1]
metrixNames = get_metrix_names(queryURL)

for metrixName in metrixNames:
    if metrixName in exclude:
        continue

    response = requests.get('{0}/api/v1/query'.format(queryURL), params={'query': metrixName+'[1y]'})
    results = response.json()['data']['result']

    os.makedirs(os.path.dirname("./csv/"), exist_ok=True)

    for result in results:
        instancePath = "./csv/"+result['metric']['instance'].split(":", 1)[0]
        os.makedirs(instancePath, exist_ok=True)

        with open(instancePath+"/"+metrixName+'.csv', "a+") as file:
            writer = csv.writer(file)

            for value in result['values']:
                l = [metrixName]+value
                writer.writerow(l)
