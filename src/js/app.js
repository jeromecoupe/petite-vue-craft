import { createApp } from "petite-vue";
import { debounce } from "lodash";

// number of items to display per page
const ITEMS_PER_PAGE = 10;

// query params
const urlParams = new URLSearchParams(location.search);

// get categories from url and make sure it's an array
function getCatsFromUrl() {
  let catsList = [];
  if (urlParams.get("catsIds")) {
    catsList = urlParams.get("catsIds").split(",");
  }
  return catsList;
}

// base categories query
const categoriesQuery = `query allCategories {
  entries(section: "resourcesCategories", orderBy: "title ASC", relatedToEntries: [{section: "resources"}]) {
    id,
    title
  }
}`;

// base resources query
const resourcesQuery = `query resources($offset: Int, $limit: Int, $catsIds: [QueryArgument], $searchQuery: String) {
  total: entryCount(section: "resources", relatedTo: $catsIds, search: $searchQuery),
  entries(section: "resources", offset: $offset, limit: $limit, relatedTo: $catsIds, search: $searchQuery) {
    id
    title
    ... on resources_default_Entry {
      resourceSummary
      commonUrl
      resourceType {
        title
      }
      resourceCategories {
        id
      }
    }
  }
}`;

/**
 * Petite Vue app
 */
createApp({
  // variables
  resources: [],
  categories: [],
  checkedCategoriesIds: getCatsFromUrl(),
  searchQuery: urlParams.get("q") || "",
  totalResults: 0,
  totalPages: 0,
  currentPage: 1,
  loading: true,
  debounceSearchInput: debounce(function (event) {
    this.currentPage = 1;
    this.searchQuery = event.target.value;
  }, 200),

  // get all categories
  async getCategories() {
    try {
      const response = await fetch("https://www.cinecolab.be/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: categoriesQuery,
        }),
      });

      // HTTP status error
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      // convert to json
      const responseJson = await response.json();

      // assign vars
      this.categories = responseJson.data.entries;
    } catch (error) {
      throw new Error(`Fetch ${error}`);
    }
  },

  // get resources with params
  async getResources() {
    try {
      // set query Strings
      let url = new URL(location);
      url.searchParams.set("q", this.searchQuery);
      url.searchParams.set("catsIds", this.checkedCategoriesIds);
      history.pushState({}, "", url);

      // get response
      const response = await fetch("https://www.cinecolab.be/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: resourcesQuery,
          variables: {
            offset: (this.currentPage - 1) * ITEMS_PER_PAGE,
            limit: ITEMS_PER_PAGE,
            catsIds: this.checkedCategoriesIds,
            searchQuery: this.searchQuery,
          },
        }),
      });

      // HTTP status error
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      // convert to json
      const responseJson = await response.json();

      // assign vars
      this.resources = responseJson.data.entries;
      this.totalResults = responseJson.data.total;
      this.totalPages = Math.ceil(responseJson.data.total / ITEMS_PER_PAGE);
    } catch (error) {
      throw new Error(`Fetch ${error}`);
    }
  },
  prevPage() {
    this.currentPage--;
  },
  nextPage() {
    this.currentPage++;
  },
}).mount("#app");
