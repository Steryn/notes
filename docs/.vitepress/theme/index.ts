import theme from "vitepress/theme";
import Naive from "naive-ui";
import "../styles/index.scss";

export default {
  extends: theme,
  enhanceApp({ app }) {
    app.use(Naive);
  },
};
