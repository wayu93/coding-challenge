I impremented the coding challenge in javascript/NodeJS. After downloading my code, make sure to run "npm install -g" from within the directory
and you'll be able to run the find_store command with all of the flags described in the challenge README. My implementation is fairly
straightforward: I read in all of the passed in flags and store them as constants. Then I use the google maps geocode api to determine the
latitude and longitude of the provided address/zip code. Afterwards, I use the jquery csv library to read and convert all the data from the
csv file into an array of JSONs, with each row being converted into a JSON where column names are keys that map to the values for that row.
I iterate through the converted csv data and use the Haversine Formula, which I've implemented, to calculate the distance between each store 
and the provided location. During each iteration, I keep track of the closest store encountered so far and whenever I encounter a store that
is even closer, I update that to be the new closest store. Finally at the end, I print out the address and distance of the closest store
while respecting the units and output format specified from the command line.