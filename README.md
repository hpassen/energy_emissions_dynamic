# Energy in America
An interactive data visualization project exploring energy generation trends in the United States from 1990 to 2019.

The project, in JavaScript and d3, involves a dynamic guided tour through the history of energy generation in the United States, and includes an interactive tool for users to explore patterns in the sources of power and in renewables in various US geographies. 

### Live Link
The live website for this project: 
https://hpassen.github.io/energy_emissions_dynamic/
**NOTE:** This website is not designed to be mobile-friendly, and will render best on a desktop or laptop. To resize, please refresh the page. 

### Libraries
This project makes use of the d3 and scrollama libraries
- d3: https://github.com/d3/d3
- scrollama: https://github.com/russellgoldenberg/scrollama 

### Data 
Data downloaded as csv and pdf, wrangled in python, and output as json in the data directory 

**United States Census Bureau**: *Intercensal Population Estimates, 1990-2019 (manually collated)*
- 2010-2019: https://www.census.gov/data/tables/time-series/demo/popest/2010s-state-total.html
- 2000-2010: https://www2.census.gov/programs-surveys/popest/tables/2000-2010/intercensal/state/
- 1990-1999: https://www2.census.gov/programs-surveys/popest/tables/1990-2000/intercensal/st-co/co-est2001-12-00.pdf

**United States Energy Information Administration**: *Net Generation by State by Type of Producer by Energy Source, 1990-2019*

https://www.eia.gov/electricity/data/state/

**United States Energy Information Administration**: *U.S. Electric Power Industry Estimated Emissions by State, 1990-2019*

https://www.eia.gov/electricity/data/state/

**World Population Review**: *State Names and Two-Letter Codes*

https://worldpopulationreview.com/states/state-abbreviations


### Credits: 
- Andrew McNutt's teaching notes and examples for setting up interactive dropdowns

- Andres Nigenda's interactive project on skin tones and social mobility in Mexico, for inspiration on how to structure a scrollama project: https://github.com/andresnigenda/dynamic-skintone

- user fryford's post on animating lines, for instructions on animating lines: http://bl.ocks.org/fryford/2925ecf70ac9d9b51031
