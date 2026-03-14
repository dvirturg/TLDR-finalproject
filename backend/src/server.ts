import initApp from "./index";

const port = process.env.PORT || 5000;

initApp().then((app) => {
  console.log("after init app.");
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
});