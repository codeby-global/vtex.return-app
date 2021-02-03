import React, { Component } from "react";
import { ContentWrapper } from "vtex.my-account-commons";
import { Button, Spinner } from "vtex.styleguide";
import { FormattedMessage } from "react-intl";
import {
  schemaTypes,
  requestsStatuses,
  schemaNames,
  sendMail
} from "../common/utils";
import { isValidIBANNumber } from "../common/validations";
import { countries } from "../common/countries";

import { PageProps } from "../typings/utils";
import styles from "../styles.css";
import {
  getCurrentDate,
  diffDays,
  FormattedMessageFixed
} from "../common/utils";
import { fetchHeaders, fetchMethod, fetchPath } from "../common/fetch";
import EligibleOrdersTable from "../components/EligibleOrdersTable";
import RequestInformation from "../components/RequestInformation";
import RequestForm from "../components/RequestForm";

type Errors = {
  name: string;
  email: string;
  phone: string;
  country: string;
  locality: string;
  address: string;
  paymentMethod: string;
  iban: string;
  agree: string;
  productQuantities: string;
  reasonMissing: string;
};

type State = {
  showForm: boolean;
  showOrdersTable: boolean;
  showInfo: boolean;
  userId: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  locality: string;
  address: string;
  paymentMethod: string;
  iban: string;
  agree: boolean;
  errorSubmit: any;
  successSubmit: any;
  errors: Errors;
  eligibleOrders: string[];
  selectedOrderId: string;
  selectedOrder: any[];
  orderProducts: any[];
  loading: boolean;
  settings: {};
  currentProduct: {};
  submittedRequest: boolean;
};

const errorMessages = {
  name: {
    id: "store/my-returns.formErrorName"
  },
  email: {
    id: "store/my-returns.formErrorEmail"
  },
  emailInvalid: {
    id: "store/my-returns.formErrorEmailInvalid"
  },
  phone: {
    id: "store/my-returns.formErrorPhone"
  },
  country: {
    id: "store/my-returns.formErrorCountry"
  },
  locality: {
    id: "store/my-returns.formErrorLocality"
  },
  address: {
    id: "store/my-returns.formErrorAddress"
  },
  paymentMethod: {
    id: "store/my-returns.formErrorPaymentMethod"
  },
  iban: {
    id: "store/my-returns.formErrorIBAN"
  },
  agree: {
    id: "store/my-returns.formErrorAgree"
  },
  productQuantities: {
    id: "store/my-returns.formErrorQuantities"
  },
  reasonMissing: {
    id: "store/my-returns.formErrorReasonMissing"
  }
};

const emailValidation = (email: string) => {
  return /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
    email
  );
};

class MyReturnsPageAdd extends Component<PageProps, State> {
  constructor(props: PageProps & State) {
    super(props);
    this.state = {
      showOrdersTable: true,
      showForm: false,
      showInfo: false,
      userId: "",
      name: "",
      email: "",
      phone: "",
      country: "",
      locality: "",
      address: "",
      paymentMethod: "",
      iban: "",
      agree: false,
      successSubmit: "",
      errorSubmit: "",
      errors: {
        name: "",
        email: "",
        phone: "",
        country: "",
        locality: "",
        address: "",
        paymentMethod: "",
        iban: "",
        agree: "",
        productQuantities: "",
        reasonMissing: ""
      },
      eligibleOrders: [],
      selectedOrderId: "",
      selectedOrder: [],
      orderProducts: [],
      settings: {},
      loading: false,
      currentProduct: {},
      submittedRequest: false
    };
    this.handleInputChange = this.handleInputChange.bind(this);
    this.selectOrder = this.selectOrder.bind(this);
  }

  async getSettings() {
    return await fetch(
      fetchPath.getDocuments +
        schemaNames.settings +
        "/" +
        schemaTypes.settings +
        "/1",
      {
        method: fetchMethod.get,
        headers: fetchHeaders
      }
    )
      .then(response => response.json())
      .then(json => {
        if (json && json[0]) {
          return Promise.resolve(json[0]);
        } else {
          return Promise.resolve(null);
        }
      });
  }

  async getProfile() {
    return await fetch(fetchPath.getProfile)
      .then(response => response.json())
      .then(response => {
        if (response.IsUserDefined) {
          this.setState({
            userId: response.UserId,
            name:
              response.FirstName && response.LastName
                ? response.FirstName + " " + response.LastName
                : "",
            email: response.Email
          });
        }
        return Promise.resolve(response);
      });
  }

  async getOrders(userEmail: string) {
    return await fetch(
      fetchPath.getOrders +
        "?clientEmail=" +
        userEmail +
        "&orderBy=creationDate,desc&f_status=invoiced"
    )
      .then(response => response.json())
      .then(res => {
        return Promise.resolve(res);
      });
  }

  async getOrder(orderId: string, userEmail: string) {
    return await fetch(
      fetchPath.getOrders + "/" + orderId + "?clientEmail=" + userEmail
    )
      .then(response => response.json())
      .then(res => {
        return Promise.resolve(res);
      });
  }

  selectOrder(order) {
    this.prepareOrderData(order, this.state.settings, false);
    if (order.shippingData.address) {
      const complement =
        order.shippingData.address.complement !== null
          ? ", " + order.shippingData.address.complement
          : "";

      this.setState({
        country: countries[order.shippingData.address.country]
          ? countries[order.shippingData.address.country]
          : order.shippingData.address.country,
        locality: order.shippingData.address.city,
        address:
          order.shippingData.address.street +
          " " +
          order.shippingData.address.number +
          complement
      });
    }

    this.setState({
      selectedOrderId: order.orderId,
      phone: order.clientProfileData.phone,
      name:
        order.clientProfileData.firstName +
        " " +
        order.clientProfileData.lastName,
      selectedOrder: order
    });
    this.showForm();
  }

  prepareOrderData = (
    order: any,
    settings: any,
    updateEligibleOrders: boolean
  ) => {
    const thisOrder = order;
    if (order.shippingData.address) {
      thisOrder.country = order.shippingData.address.country;
      thisOrder.city = order.shippingData.address.city;
      const complement =
        order.shippingData.address.complement !== null
          ? ", " + order.shippingData.address.complement
          : "";
      thisOrder.address =
        order.shippingData.address.street +
        " " +
        order.shippingData.address.number +
        complement;
    }

    const promises = order.items.map((product: any) => {
      return new Promise((resolve, reject) => {
        let categoryCount = 0;
        let eligible = false;
        const excludedCategories = JSON.parse(settings.excludedCategories);
        if (excludedCategories.length) {
          const categories = product.additionalInfo.categories;
          if (categories.length) {
            categories.map((category: any) => {
              const excludedMatch = excludedCategories.filter(
                excl => category.id === excl.id
              );
              if (excludedMatch.length) {
                categoryCount++;
              }
            });
          }
        } else {
          eligible = true;
        }

        eligible = !categoryCount;

        const where =
          "userId=" +
          this.state.userId +
          "__orderId=" +
          order.orderId +
          "__skuId=" +
          product.refId;

        let currentProduct = {
          ...product,
          selectedQuantity: 0
        };

        this.checkProduct(where)
          .then(response => {
            if (response >= product.quantity) {
              eligible = false;
              return eligible;
            } else {
              currentProduct = {
                ...currentProduct,
                quantity: currentProduct.quantity - response,
                reasonCode: "",
                reason: ""
              };
              return eligible;
            }
          })
          .then(isEligible => {
            if (isEligible) {
              resolve(currentProduct);
              return;
            } else {
              resolve(false);
              return;
            }
          });
      });
    });
    Promise.all(promises)
      .then(eligibleProducts => {
        const products = eligibleProducts.filter(product => product);
        const previousOrders = this.state.eligibleOrders;
        if (products.length) {
          if (updateEligibleOrders) {
            previousOrders.push(thisOrder);
            this.setState({
              eligibleOrders: previousOrders
            });
          }
        }
        return { previousOrders, products };
      })
      .then(({ previousOrders, products }) => {
        this.setState({
          orderProducts: products,
          eligibleOrders: previousOrders
        });

        setTimeout(() => {
          this.setState({ loading: false });
        }, 500);
      });
  };

  async checkProduct(where: string) {
    return await fetch(
      fetchPath.getDocuments +
        schemaNames.product +
        "/" +
        schemaTypes.products +
        "/" +
        where
    )
      .then(response => response.json())
      .then(response => {
        let thisQuantity = 0;
        if (response) {
          response.map((receivedProduct: any) => {
            thisQuantity += receivedProduct.quantity;
          });
        }
        return Promise.resolve(thisQuantity);
      });
  }

  prepareData = () => {
    this.setState({ loading: true });
    const currentDate = getCurrentDate();
    this.getSettings().then(settings => {
      if (settings !== null) {
        this.setState({ settings: settings });
        this.getProfile().then(user => {
          this.getOrders(user.Email).then(orders => {
            if ("list" in orders) {
              if (orders.list.length) {
                orders.list.map((order: any) => {
                  if (
                    diffDays(currentDate, order.creationDate) <=
                    settings.maxDays
                  ) {
                    this.getOrder(order.orderId, user.Email).then(
                      currentOrder => {
                        this.prepareOrderData(currentOrder, settings, true);
                      }
                    );
                  }
                });
                setTimeout(() => {
                  this.setState({ loading: false });
                }, 1000);
              } else {
                this.setState({ loading: false });
              }
            }
          });
        });
      } else {
        this.setState({ loading: false });
      }
    });
  };

  componentDidMount() {
    this.prepareData();
  }

  resetErrors() {
    this.setState({
      errors: {
        name: "",
        email: "",
        phone: "",
        country: "",
        locality: "",
        address: "",
        paymentMethod: "",
        iban: "",
        agree: "",
        productQuantities: "",
        reasonMissing: ""
      },
      errorSubmit: "",
      successSubmit: ""
    });
  }

  validateForm() {
    let errors = false;
    this.resetErrors();

    const {
      name,
      email,
      phone,
      country,
      locality,
      address,
      paymentMethod,
      iban,
      agree,
      orderProducts
    } = this.state;

    if (!name) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          name: errorMessages.name.id
        }
      }));
      errors = true;
    }
    if (!email) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          email: errorMessages.email.id
        }
      }));
      errors = true;
    }

    if (email && !emailValidation(email)) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          email: errorMessages.emailInvalid.id
        }
      }));
      errors = true;
    }

    if (!phone) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          phone: errorMessages.phone.id
        }
      }));
      errors = true;
    }

    if (!country) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          country: errorMessages.country.id
        }
      }));
      errors = true;
    }

    if (!locality) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          locality: errorMessages.locality.id
        }
      }));
      errors = true;
    }

    if (!address) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          address: errorMessages.address.id
        }
      }));
      errors = true;
    }

    if (!paymentMethod) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          paymentMethod: errorMessages.paymentMethod.id
        }
      }));
      errors = true;
    } else if (
      (paymentMethod === "bank" && !iban) ||
      (paymentMethod === "bank" && !isValidIBANNumber(iban))
    ) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          iban: errorMessages.iban.id
        }
      }));
      errors = true;
    }

    if (!agree) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          agree: errorMessages.agree.id
        }
      }));
      errors = true;
    }

    let quantities = 0;

    orderProducts.map((product: any) => {
      if (product.selectedQuantity === "") {
        quantities += 0;
      } else {
        quantities += parseInt(product.selectedQuantity);
      }

      const reason = product.reason;

      if (
        parseInt(product.selectedQuantity) > 0 &&
        (product.reasonCode === "" ||
          (product.reasonCode === "reasonOther" &&
            (product.reason === "" || !reason.replace(/\s/g, "").length)))
      ) {
        errors = true;
      }
    });

    if (quantities === 0) {
      this.setState(prevState => ({
        errors: {
          ...prevState.errors,
          productQuantities: errorMessages.productQuantities.id
        }
      }));
      errors = true;
    }

    return !errors;
  }

  handleInputChange(event: any) {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    this.setState({ ...this.state, [name]: value });
  }

  submit() {
    if (this.validateForm()) {
      this.setState({
        showOrdersTable: false,
        showForm: false,
        showInfo: true
      });
    }
  }

  showTable() {
    this.setState({
      showOrdersTable: true,
      showForm: false,
      showInfo: false
    });
  }

  showForm() {
    this.resetErrors();
    this.setState({
      showOrdersTable: false,
      showForm: true,
      showInfo: false
    });
  }

  handleQuantity(product: any, quantity: any) {
    this.setState(prevState => ({
      orderProducts: prevState.orderProducts.map(el =>
        el.uniqueId === product.uniqueId
          ? {
              ...el,
              selectedQuantity:
                quantity > product.quantity ? product.quantity : quantity
            }
          : el
      )
    }));
  }

  handleReasonCode(product: any, value: any) {
    this.setState(prevState => ({
      orderProducts: prevState.orderProducts.map(el =>
        el.uniqueId === product.uniqueId
          ? {
              ...el,
              reasonCode: value,
              reason: ""
            }
          : el
      )
    }));
  }

  handleReason(product: any, value: any) {
    this.setState(prevState => ({
      orderProducts: prevState.orderProducts.map(el =>
        el.uniqueId === product.uniqueId
          ? {
              ...el,
              reason: value
            }
          : el
      )
    }));
  }

  sendRequest() {
    let totalPrice = 0;
    this.setState({ errorSubmit: "" });
    const {
      userId,
      selectedOrderId,
      name,
      email,
      phone,
      country,
      locality,
      address,
      paymentMethod,
      iban,
      orderProducts
    } = this.state;
    orderProducts.map((product: any) => {
      totalPrice += product.selectedQuantity * product.sellingPrice;
    });

    const requestData = {
      userId: userId,
      orderId: selectedOrderId,
      name: name,
      email: email,
      phoneNumber: phone,
      country: country,
      locality: locality,
      address: address,
      paymentMethod: paymentMethod,
      totalPrice: totalPrice,
      refundedAmount: 0,
      voucherCode: "",
      iban: iban,
      status: requestsStatuses.new,
      dateSubmitted: getCurrentDate(),
      type: schemaTypes.requests
    };

    this.sendData(requestData, schemaNames.request).then(response => {
      if ("DocumentId" in response) {
        this.addStatusHistory(response.DocumentId).then();
        this.submitProductRequest(response.DocumentId)
          .then(() => {
            this.setState({
              successSubmit: (
                <FormattedMessageFixed
                  id={"store/my-returns.requestSubmitSuccess"}
                />
              ),
              submittedRequest: true
            });
            sendMail({
              data: { ...requestData, ...response },
              products: orderProducts
            });
          })
          .then(() => {
            this.showTable();
          });
      } else {
        this.setState({
          errorSubmit: (
            <FormattedMessageFixed id={"store/my-returns.requestSubmitError"} />
          ),
          submittedRequest: true
        });
      }
    });
  }

  async addStatusHistory(DocumentId: string) {
    const { name } = this.state;
    const bodyData = {
      submittedBy: name,
      refundId: DocumentId,
      status: requestsStatuses.new,
      dateSubmitted: getCurrentDate(),
      type: schemaTypes.history
    };

    this.sendData(bodyData, schemaNames.history).then();
  }

  async submitProductRequest(DocumentId: string) {
    const { orderProducts, userId, selectedOrderId } = this.state;
    orderProducts.map((product: any) => {
      if (parseInt(product.selectedQuantity) > 0) {
        const productData = {
          userId: userId,
          orderId: selectedOrderId,
          refundId: DocumentId,
          skuId: product.refId,
          skuName: product.name,
          imageUrl: product.imageUrl,
          reasonCode: product.reasonCode,
          reason: product.reason,
          unitPrice: parseInt(product.sellingPrice),
          quantity: parseInt(product.selectedQuantity),
          totalPrice: parseInt(
            String(product.sellingPrice * product.selectedQuantity)
          ),
          goodProducts: 0,
          status: requestsStatuses.new,
          dateSubmitted: getCurrentDate(),
          type: schemaTypes.products
        };

        this.sendData(productData, schemaNames.product).then();
      }
    });
  }

  async sendData(body: any, schema: string) {
    return await fetch(fetchPath.saveDocuments + schema, {
      method: fetchMethod.post,
      body: JSON.stringify(body),
      headers: fetchHeaders
    })
      .then(response => response.json())
      .then(json => {
        if (json) {
          return Promise.resolve(json);
        } else {
          return Promise.resolve(null);
        }
      });
  }
  render() {
    const {
      showOrdersTable,
      showForm,
      showInfo,
      name,
      email,
      phone,
      country,
      locality,
      address,
      paymentMethod,
      iban,
      agree,
      errors,
      eligibleOrders,
      orderProducts,
      loading,
      errorSubmit,
      successSubmit,
      selectedOrder,
      submittedRequest,
      settings
    }: any = this.state;
    return (
      <ContentWrapper {...this.props.headerConfig}>
        {() => {
          if (loading) {
            return (
              <div className={`flex justify-center pt6 pb6`}>
                <Spinner />
              </div>
            );
          }

          if (submittedRequest) {
            return (
              <div>
                {successSubmit ? (
                  <div>
                    <p className={styles.successMessage}>{successSubmit}</p>
                  </div>
                ) : null}
                <div className={`flex flex-column items-center`}>
                  <span className="mb4">
                    <Button href={"/account#/my-returns"}>
                      <FormattedMessage id={"store/my-returns.backToOrders"} />
                    </Button>
                  </span>
                </div>
              </div>
            );
          }
          return (
            <div>
              {showOrdersTable ? (
                <EligibleOrdersTable
                  eligibleOrders={eligibleOrders}
                  selectOrder={order => this.selectOrder(order)}
                />
              ) : null}
              {showForm ? (
                <RequestForm
                  settings={settings}
                  showTable={() => {
                    this.showTable();
                  }}
                  selectedOrder={selectedOrder}
                  orderProducts={orderProducts}
                  handleQuantity={(product, value) => {
                    this.handleQuantity(product, value);
                  }}
                  handleReasonCode={(product, value) => {
                    this.handleReasonCode(product, value);
                  }}
                  handleReason={(product, value) => {
                    this.handleReason(product, value);
                  }}
                  errors={errors}
                  handleInputChange={e => this.handleInputChange(e)}
                  formInputs={{
                    name: name,
                    email: email,
                    phone: phone,
                    country: country,
                    locality: locality,
                    address: address,
                    paymentMethod: paymentMethod,
                    iban: iban,
                    agree: agree
                  }}
                  submit={() => {
                    this.submit();
                  }}
                />
              ) : null}
              {showInfo ? (
                <RequestInformation
                  info={{
                    name: name,
                    email: email,
                    phone: phone,
                    country: country,
                    locality: locality,
                    address: address,
                    paymentMethod: paymentMethod,
                    iban: iban
                  }}
                  orderProducts={orderProducts}
                  showForm={() => {
                    this.showForm();
                  }}
                  sendRequest={() => {
                    this.sendRequest();
                  }}
                  errorSubmit={errorSubmit}
                />
              ) : null}
            </div>
          );
        }}
      </ContentWrapper>
    );
  }
}

export default MyReturnsPageAdd;
