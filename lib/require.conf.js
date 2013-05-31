
requirejs.config({
    paths: {
        spec: '../spec'
    },
    deps: ["spec/sokuza.spec"],
    callback: function() {
        setTimeout(function () {
            var jasmineEnv = jasmine.getEnv(),
                reporter = new jasmine.HtmlReporter();
            jasmineEnv.addReporter(reporter);
            jasmineEnv.execute();
        }, 10);
    }
});
