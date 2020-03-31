[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Uptime Robot ratio (30 days)](https://img.shields.io/uptimerobot/ratio/m784644296-117aff91bf68fe2afd2d4d12)

# [MeFee Temperature Tracker](https://mefee.org)

A site where people can log their temperature readings daily. Once we have enough data (at least 20 days worth) we can provide personalised feedback on if the person's temperature seems to be trending towards a fever, before it reaches the official degree required. This may help people spot symptoms of COVID19 earlier and so self-isolate to protect others that much sooner.

 - The median incubation period before symptoms are typically identified for COVID19 has been [estimated at 5.1 days.](https://annals.org/aim/fullarticle/2762808/incubation-period-coronavirus-disease-2019-covid-19-from-publicly-reported) During that period, people are contagious ([with the average serial interval estimated at 3.96 days](https://www.medrxiv.org/content/medrxiv/early/2020/03/06/2020.02.19.20025452.full.pdf)). Even with moderate degrees of isolation, the virus can still spread within the household, a particularly common vector for COVID19.
 - Typically a temperature is not considered a medically significant [fever until it reaches 100.4F](https://www.cdc.gov/quarantine/air/reporting-deaths-illness/definitions-symptoms-reportable-illnesses.html). However, this value is calibrated for population-wide clinical significance. It can not account for individualized average temperature and variation, which could provide earlier personalized indication of temperature being abnormal. Nor was it designed to be an early indicator of infection.
 - If symptoms of COVID19 were detectable earlier, individuals could more effectively isolate at an earlier point in time, reducing the likelihood of transmission.

# Running locally
```
npm run-script test
```

Depends on having `serve` installed on your path (recommend: `npm i --global serve`)

This connects to the production firebase instance. There is no isolated test environment.

# Deploying
```
npm run-script deploy
```

Depends on having `firebase-tools` installed on your path (recommend: `npm i --global firebase-tools`)
