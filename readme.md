# Mappy Scrapping
Mappy scapping is a small tool i made to scrap data from mappy, you can get them from a json api

## how to fetch the data?

use `http://127.0.0.1:8080/trajet/{point_a}/{point_b}` as a json api

## how to compile

i use pkg to compile the project in a single exe file
this example is for windows x64 (with node 16)
```
npm install -g pkg
pkg -t node16-win-x64 .
```

