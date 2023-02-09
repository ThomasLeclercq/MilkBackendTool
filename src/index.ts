
( async () => {
  try {

    console.log("Done");
    process.exit(0);

  } catch (err) {
    console.error("Oops something went wrong ", err);
    process.exit(1);
  }
})()