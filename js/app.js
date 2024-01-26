import { createApp } from "https://unpkg.com/petite-vue?module";

// nomber of items to display per page
const ITEMS_PER_PAGE = 10;

// base categories query
const categoriesQuery = `query allCategories {
  entries(section: "resourcesCategories", orderBy: "title ASC", relatedToEntries: [{section: "resources"}]) {
    id,
    title
  }
}`;

// base resources query
const resourcesQuery = `query resources($offset: Int, $limit: Int, $catIds: [QueryArgument], $searchQuery: String) {
  total: entryCount(section: "resources", relatedTo: $catIds, search: $searchQuery),
  entries(section: "resources", offset: $offset, limit: $limit, relatedTo: $catIds, search: $searchQuery) {
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
  checkedCategoriesIds: [],
  q: "",
  searchQuery: "",
  totalResults: 0,
  totalPages: 0,
  currentPage: 1,
  loading: true,

  // get all categories
  async getCategories() {
    const response = await fetch("https://cinecolab.ddev.site/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: categoriesQuery,
      }),
    });

    const responseData = await response.json();
    this.categories = responseData.data.entries;
  },

  async getResources() {
    const response = await fetch("https://cinecolab.ddev.site/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: resourcesQuery,
        variables: {
          offset: (this.currentPage - 1) * ITEMS_PER_PAGE,
          limit: ITEMS_PER_PAGE,
          catIds: this.checkedCategoriesIds,
          searchQuery: this.searchQuery,
        },
      }),
    });

    const responseJson = await response.json();

    this.resources = responseJson.data.entries;
    this.totalResults = responseJson.data.total;
    this.totalPages = Math.ceil(this.totalResults / ITEMS_PER_PAGE);
  },
  clearSearch() {
    this.q = "";
    this.searchQuery = "";
    this.currentPage = 1;
  },
  setSearch() {
    this.searchQuery = this.q;
    this.currentPage = 1;
  },
  prevPage() {
    this.currentPage--;
  },
  nextPage() {
    this.currentPage++;
  },
}).mount("#app");
