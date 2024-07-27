let checkedBoxes = ['11']; // Stores the checked checkboxes, initially the first one is checked
//let checkedAge = [];
//let checkedSex = [];

const jsonQuery = 
{
    "query": [
      {
        "code": "Alue",
        "selection": {
          "filter": "item",
          "values": ["SSS"]
        }
      },
      {
        "code": "Pääasiallinen toiminta",
        "selection": {
          "filter": "item",
          "values": ["11"]
        }
      },
      {
        "code": "Sukupuoli",
        "selection": {
          "filter": "item",
          "values": [
            "SSS"
          ]
        }
      },
      {
        "code": "Ikä",
        "selection": {
          "filter": "item",
          "values": ["SSS"]
        }
      },
      {
        "code": "Vuosi",
        "selection": {
            "filter": "item",
            "values": [
            "2010",
            "2011",
            "2012",
            "2013",
            "2014",
            "2015",
            "2016",
            "2017",
            "2018",
            "2019",
            "2020",
            "2021",
            "2022"
        ]
      }
    }],
    "response": {
      "format": "json-stat2"
    }
  }

const getData = async () => { // Fetches data from the API and returns it
    console.log('jsonQuery', jsonQuery)
    const url = "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/tyokay/statfin_tyokay_pxt_115b.px"
    const res = await fetch(url, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify(jsonQuery)
    })
    if(!res.ok) {
        return;
    }
    const data = await res.json()
    return data
}

const buildChart = async (type="line") => { // Builds the chart, accepts the type of the chart as an argument
    const data = await getData();

    const years = Object.values(data.dimension.Vuosi.category.label); // x-axis values
    const sortingCriteria = data.dimension['Pääasiallinen toiminta'].category.index; // Tells the order of the data
    const separationPoint = data.value.length / checkedBoxes.length; // Separates the data into equal parts

    let datasets = [];

    checkedBoxes.forEach((value) => {
        const order = sortingCriteria[value];
        datasets.push({
            name: document.querySelector(`label[for="${value}"]`).textContent,
            values: data.value.slice(separationPoint * order, separationPoint * (order + 1))
        })
    });
    
    const chartData = {
        labels: years,
        datasets: datasets
    }

    const chart = new frappe.Chart("#chart", {
        title: "Votes in Finnish municipalities",
        data: chartData,
        type: type,
        height: 450,
        colors: ['red', 'blue', 'green', 'purple', 'orange', 'black']
    })
}

document.addEventListener("DOMContentLoaded", async () => { // When the page is loaded
    const dropdown = document.querySelector(".dropdown"); // Contains the dropdown content
    const dropdownInput = document.getElementById("dropdownInput"); // The input field in the dropdown
    const dropdownList = document.getElementById("dropdownList"); // The list of regions in the dropdown
    const selectGraph = document.getElementById("selectGraph");
    const checkBoxes = document.querySelectorAll(".checkBox");
    const download = document.getElementById("downloadChart");
    const arrowDown = document.getElementById("arrowDown");

    download.addEventListener("click", () => { // Downloads the chart as a PNG image
        html2canvas(document.getElementById("chart")).then(canvas => {
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = "chart.png";
            link.click();
        });
    });
    
    const fetchRegion = async () => { // Gets the regions from the JSON file
        const url = "../../Data/regions.json"
        const res = await fetch(url)
        const data = await res.json()   
        return data
    };

    const getUrlParameter = () => { // Gets the query parameters from the URL, returns them as an array
        const queryString = window.location.search;
        const region = queryString.split('?')[1];
        const id = queryString.split('?')[2];
        if (region && id) {
            return [region, id];
        }
        return null;
    };

    const optionValues = await fetchRegion(); // Gets the regions from the JSON file
    const populateDropdown = async () => { // Populates the dropdown with the regions
        dropdownList.innerHTML = ''; // Clears the dropdown list first

        Object.entries(optionValues).forEach(([key, value]) => {
            const option = document.createElement('div');
            option.textContent = value;
            option.dataset.value = key; // Sets the dataset value to the key

            option.addEventListener('click', () => { // When an option is clicked
                dropdownInput.value = value;
                dropdown.classList.remove('dropdown-active'); // Hides the dropdown

                jsonQuery.query[0].selection.values = [key];
                buildChart(selectGraph.value);
            });
            dropdownList.appendChild(option)
        });
    }

    function filterOptions() { // Filters the options in the dropdown
        const filterText = dropdownInput.value.toLowerCase();

        const options = dropdownList.children; // these are divs
        Object.values(options).forEach(option => {
            const text = option.textContent.toLocaleLowerCase();
            if (text.includes(filterText)) // If the text includes the filter text
                option.style.display = ''; // display
            else
                option.style.display = 'none'; // don't display
        })
    }

    dropdownInput.addEventListener("focus", function() {
        dropdown.classList.add("dropdown-active");
    });

    dropdownInput.addEventListener("blur", function() {
        // Timeout to allow click event to register before hiding
        setTimeout(() => {
            dropdown.classList.remove("dropdown-active");
        }, 200);
    });

    /*----------- HANDLING REDIRECT FROM MAP TO CHART --------------*/
    const regionParam = getUrlParameter(); // Gets the array of query parameters or null
    if (regionParam) { // If there are query parameters
        let id = '';
        checkBoxes.forEach(checkbox => {
            if (regionParam[1] === checkbox.value){
                checkbox.checked = true;
                id = checkbox.value;
                checkedBoxes = []; // clears the checked boxes
                checkedBoxes.push(id); // pushes the checked box
            }
            else
                checkbox.checked = false; // unchecks the other checkboxes (if any)
        });
        const regionName = optionValues[regionParam[0]];
        if (regionName) {
            dropdownInput.value = regionName;
            jsonQuery.query[0].selection.values = [regionParam[0]];
            jsonQuery.query[1].selection.values = [id];
            buildChart(selectGraph.value);
            // removes the query parameters from the URL
            window.history.replaceState({}, document.title, "../../Employment/Chart/index.html");
            document.getElementById('chart').scrollIntoView({behavior: "smooth"});
        }
        else console.log('Municipality not found')
    }
    else console.log('NOTHING')
    /*------------------------------------------------------------*/

    selectGraph.addEventListener("change", () => {
        if (selectGraph.value === "line") {
            buildChart("line");
        }
        else {
            buildChart("bar");
        }
    });  
    
    checkBoxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            // collect all the checked checkboxes, and return array of their values
            const checked = Array.from(checkBoxes).filter(checkbox => checkbox.checked);
            const values = checked.map(checkbox => checkbox.value);
            if (values.length !== 0) {
                jsonQuery.query[1].selection.values = values;
                buildChart(selectGraph.value);
                checkedBoxes = []; // clears the checked boxes
                checkedBoxes = values; // pushes the checked boxes
            }
        });
    });

    arrowDown.addEventListener("click", () => {
        dropdown.scrollIntoView({behavior: "smooth"});
    });

    dropdownInput.addEventListener("input", filterOptions);
    populateDropdown();
    buildChart();
});
