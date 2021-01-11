import React, { Component } from "react";
import { FormattedMessage } from "react-intl";
import styles from "../styles.css";

interface Props {
  request: any;
}

class RequestInfo extends Component<Props> {
  constructor(props) {
    super(props);
  }

  render() {
    const { request } = this.props;
    return (
      <div>
        <div className={`flex-ns flex-wrap flex-row`}>
          <div className={`flex-ns flex-wrap flex-auto flex-column pt4 pb4`}>
            <p>
              <strong>
                <FormattedMessage id={"admin/returns.contactDetails"} />
              </strong>
            </p>
            <div className={"mb5"}>
              <p className={"ma0 t-small c-on-base "}>
                <FormattedMessage id={"admin/returns.name"} />: {request.name}
              </p>
            </div>
            <div className={"mb5"}>
              <p className={"ma0 t-small c-on-base "}>
                <FormattedMessage id={"admin/returns.email"} />: {request.email}
              </p>
            </div>
            <div className={"mb5"}>
              <p className={"ma0 t-small c-on-base "}>
                <FormattedMessage id={"admin/returns.phone"} />:{" "}
                {request.phoneNumber}
              </p>
            </div>
          </div>

          <div className={`flex-ns flex-wrap flex-auto flex-column pa4`}>
            <p>
              <strong>
                <FormattedMessage id={"admin/returns.pickupAddress"} />
              </strong>
            </p>
            <div className={"mb5"}>
              <p className={"ma0 t-small c-on-base"}>
                <FormattedMessage id={"admin/returns.country"} />:{" "}
                {request.country}
              </p>
            </div>
            <div className={"mb5"}>
              <p className={"ma0 t-small c-on-base"}>
                <FormattedMessage id={"admin/returns.locality"} />:{" "}
                {request.locality}
              </p>
            </div>
            <div className={"mb5"}>
              <p className={"ma0 t-small c-on-base"}>
                <FormattedMessage id={"admin/returns.address"} />:{" "}
                {request.address}
              </p>
            </div>
          </div>
        </div>
        <p>
          <strong>
            <FormattedMessage id={"admin/returns.refundPaymentMethod"} />
          </strong>
        </p>
        {request.paymentMethod === "bank" ? (
          <div className={"flex-ns flex-wrap flex-auto flex-column mt4"}>
            <p className={"ma1 t-small c-on-base "}>
              <FormattedMessage
                id={"store/my-returns.formBankTransferAccount"}
              />{" "}
              {request.iban}
            </p>
          </div>
        ) : (
          <p className={"ma1 t-small c-on-base " + styles.capitalize}>
            {request.paymentMethod}
          </p>
        )}
      </div>
    );
  }
}

export default RequestInfo;