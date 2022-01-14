const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";
function LocalPromise(executor) {
  this.state = PENDING;
  this.value = null;
  this.reason = null;
  this.onFulfilledCB = [];
  this.onRejectedCB = [];

  this.resolve = function (value) {
    if (this.state === PENDING) {
      this.state = FULFILLED;
      this.value = value;

      if (this.onFulfilledCB.length > 0) {
        this.onFulfilledCB.forEach((onFulfilled) => {
          setTimeout(() => {
            onFulfilled(this.value);
          }, 0);
        });
      }
    }
  };

  this.reject = function (reason) {
    if (this.state === PENDING) {
      this.state = REJECTED;
      this.reason = reason;

      if (this.onRejectedCB.length > 0) {
        this.onRejectedCB.forEach((onRejected) => {
          setTimeout(() => {
            onRejected(this.reason);
          }, 0);
        });
      }
    }
  };

  executor(this.resolve.bind(this), this.reject.bind(this));
}

function resolvePromise(x) {}
LocalPromise.prototype.then = function (
  potential_onFulfilled,
  potential_onRejected
) {
  const onFulfilled =
    (typeof potential_onFulfilled === "function" && potential_onFulfilled) ||
    ((value) => value);
  const onRejected =
    (typeof potential_onRejected === "function" && potential_onRejected) ||
    ((reason) => {
      if (reason instanceof Error) {
        throw reason;
      } else {
        throw new Error(reason);
      }
    });

  return new LocalPromise((resolve, reject) => {
    if (this.state === FULFILLED) {
      setTimeout(() => {
        try {
          const x = onFulfilled(this.value);
          if (x instanceof LocalPromise) {
            x.then(resolve, reject);
          } else {
            resolve(x);
          }
        } catch (e) {
          reject(e);
        }
      }, 0);
    } else if (this.state === REJECTED) {
      setTimeout(() => {
        try {
          const x = onRejected(this.reason);
          reject(x);
        } catch (e) {
          reject(e);
        }
      }, 0);
    } else {
      this.onFulfilledCB.push((value) => {
        setTimeout(() => {
          try {
            const x = onFulfilled(value);
            if (x instanceof LocalPromise) {
              x.then(resolve, reject);
            } else {
              resolve(x);
            }
          } catch (e) {
            reject(e);
          }
        }, 0);
      });
      this.onRejectedCB.push((reason) => {
        try {
          const x = onRejected(reason);
          reject(x);
        } catch (e) {
          reject(e);
        }
      });
    }
  });
};

new LocalPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("hello world");
  }, 2000);
})
  .then((value) => {
    console.log(value);
  })
  .then((value) => {
    return new LocalPromise((resolve) => {
      setTimeout(() => {
        resolve("hello rabbit");
      }, 2000);
    });
  })
  .then((value) => {
    console.log(value);
  });
