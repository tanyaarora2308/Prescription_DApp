import React, { Component } from "react";
import getWeb3 from "../getWeb3";
import {
  Redirect,
  BrowserRouter as Router,
  Route,
  Switch,
} from "react-router-dom";

// React-Bootstrap imports
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Navbar from "react-bootstrap/Navbar";
import Alert from "react-bootstrap/Alert";

// Smart Contract imports
import UserContract from "../../contracts/User.json";

// Component imports
import Login from "./../login";

class RegisterPhysician extends Component {
  state = {
    web3: null,
    userContract: null,
    account: null,
    formData: {},
    missingInput: false,
    registration_accepted: false,
    userExistance: null,
    initialize: false,
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount = async () => {
    // Reads out the selected account from the user in MetaMask and stores it in the react state
    const ethereum = await window.ethereum;
    // const public_key = ethereum.selectedAddress;
    // this.setState({account: public_key});

    // If user changes his account, then the verification to access the page is checked and afterwards the new account is stored in the react state
    ethereum.on("accountsChanged", (public_key) => {
      this.setState({ account: public_key[0] });
      if (this.state.initialize === true) {
        this.checkExistence();
      }
    });

    // Establishing the connection to the blockchain and the smart contracts
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      const networkId = await web3.eth.net.getId();
      const UserContractNetwork = UserContract.networks[networkId];

      const UserContractInstance = new web3.eth.Contract(
        UserContract.abi,
        UserContractNetwork && UserContractNetwork.address
      );

      this.setState({
        web3: web3,
        account: account,
        userContract: UserContractInstance,
        initialize: true,
      });
      this.checkExistence();
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  // Checks if the user, that is logged in in MetaMask, is already registered as any role.
  checkExistence = async () => {
    const { userContract } = this.state;
    const existence_insured = await userContract.methods
      .checkExistence("insured", this.state.account)
      .call({ from: this.state.account, gas: 1000000 });
    const existence_physician = await userContract.methods
      .checkExistence("physician", this.state.account)
      .call({ from: this.state.account, gas: 1000000 });
    const existence_pharmacist = await userContract.methods
      .checkExistence("pharmacist", this.state.account)
      .call({ from: this.state.account, gas: 1000000 });
    const existence_verifying_inst = await userContract.methods
      .checkExistence("verifying_institution", this.state.account)
      .call({ from: this.state.account, gas: 1000000 });

    if (
      existence_insured === true ||
      existence_physician === true ||
      existence_pharmacist === true ||
      existence_verifying_inst === true
    ) {
      this.setState({ userExistance: true });
    } else {
      this.setState({ userExistance: false });
    }
  };

  handleChange(event) {
    // Reading out the value and the id of the triggered input
    const event_id = event.target.id;
    const event_value = event.target.value;

    // Setting the value into the user object of the state
    const { formData } = this.state;
    formData[event_id] = event_value;
    this.setState({ formData: formData });
  }

  // If all inputs are filled, a new physician is added with the Smart Contract User
  addNewUser = async () => {
    const { userContract, formData } = this.state;

    const job_title = formData.physician_job_title;
    const surname = formData.physician_surname;
    const name = formData.physician_name;
    const physician_number = formData.physician_number;

    const street = formData.physician_street;
    const street_number = formData.physician_street_number;
    const post_code = parseInt(formData.physician_post_code);
    const city = formData.physician_city;
    const telephone_number = formData.telephone_number;
    const business_number = formData.business_number;

    if (
      job_title !== "" &&
      job_title !== undefined &&
      surname !== "" &&
      surname !== undefined &&
      name !== "" &&
      name !== undefined &&
      physician_number !== "" &&
      physician_number !== undefined &&
      street !== "" &&
      street !== undefined &&
      street_number !== "" &&
      street_number !== undefined &&
      post_code !== "" &&
      post_code !== undefined &&
      city !== "" &&
      city !== undefined &&
      telephone_number !== "" &&
      telephone_number !== undefined &&
      business_number !== "" &&
      business_number !== undefined
    ) {
      await userContract.methods
        .addNewPhysician({
          job_title,
          surname,
          name,
          physician_number,
          street,
          street_number,
          post_code,
          city,
          telephone_number,
          business_number,
        })
        .send({ from: this.state.account, gas: 1000000 });
      this.setState({ registration_accepted: true });
    } else {
      this.setState({ missingInput: true });
    }
  };

  render() {
    // If user is already existing or the registration is done, then the user is redirected to the login. Otherwise the page is rendered.
    if (
      this.state.userExistance === true ||
      this.state.registration_accepted === true
    ) {
      return (
        <div>
          <Router forceRefresh={true}>
            <Redirect push to="/login" />
            <Switch>
              <Route path="/login">
                <Login />
              </Route>
            </Switch>
          </Router>
        </div>
      );
    } else {
      return (
        <>
          <Navbar sticky="top" bg="light" variant="dark" expand="lg">
            <Navbar.Brand style={{color:"#1eb2a6"}}href="/login">E-recipe</Navbar.Brand>
          </Navbar>

          <Container fluid className="mt-5" >
            <Row > 
              <Col xs={0} sm={1} md={3} lg={4}></Col>

              <Col>
                <Form >
                  <div className="pb-3 pt-4">Information about the doctor:</div>

                  <Form.Group controlId="physician_job_title">
                    <Form.Control
                      type="text"
                      placeholder="Job title"
                      value={this.state.value}
                      onChange={this.handleChange}
                    ></Form.Control>
                  </Form.Group>

                  <Row>
                    <Col className="pr-1">
                      <Form.Group controlId="physician_surname">
                        <Form.Control
                          type="text"
                          placeholder="First name"
                          value={this.state.value}
                          onChange={this.handleChange}
                        ></Form.Control>
                      </Form.Group>
                    </Col>
                    <Col className="pl-1">
                      <Form.Group controlId="physician_name">
                        <Form.Control
                          type="text"
                          placeholder="Name"
                          value={this.state.value}
                          onChange={this.handleChange}
                        ></Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group controlId="physician_number">
                    <Form.Control
                      type="number"
                      placeholder="Doctor-no."
                      value={this.state.value}
                      onChange={this.handleChange}
                    ></Form.Control>
                  </Form.Group>

                  <div className="pb-3 pt-4">Information on the permanent establishment:</div>

                  <Row>
                    <Col className="pr-1" sm={9}>
                      <Form.Group controlId="physician_street">
                        <Form.Control
                          type="text"
                          placeholder="street"
                          value={this.state.value}
                          onChange={this.handleChange}
                        ></Form.Control>
                      </Form.Group>
                    </Col>
                    <Col className="pl-1" sm={3}>
                      <Form.Group controlId="physician_street_number">
                        <Form.Control
                          type="text"
                          placeholder="House number"
                          value={this.state.value}
                          onChange={this.handleChange}
                        ></Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col className="pr-1" sm={4}>
                      <Form.Group controlId="physician_post_code">
                        <Form.Control
                          type="number"
                          placeholder="Postal code"
                          value={this.state.value}
                          onChange={this.handleChange}
                        ></Form.Control>
                      </Form.Group>
                    </Col>
                    <Col className="pl-1" sm={8}>
                      <Form.Group controlId="physician_city">
                        <Form.Control
                          type="text"
                          placeholder="City"
                          value={this.state.value}
                          onChange={this.handleChange}
                        ></Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group controlId="telephone_number">
                    <Form.Control
                      type="text"
                      placeholder="Phone no."
                      value={this.state.value}
                      onChange={this.handleChange}
                    ></Form.Control>
                  </Form.Group>

                  <Form.Group controlId="business_number" className="pb-3">
                    <Form.Control
                      type="number"
                      placeholder="Operating place no."
                      value={this.state.value}
                      onChange={this.handleChange}
                    ></Form.Control>
                  </Form.Group>
                </Form>

                <Button className="button1" block onClick={this.addNewUser}>
                  Register
                </Button>

                <Alert
                  show={this.state.missingInput}
                  variant="danger"
                  className="mt-3"
                >
                  Please fill out all input fields!
                </Alert>
              </Col>

              <Col xs={0} sm={1} md={3} lg={4}></Col>
            </Row>
          </Container>
        </>
      );
    }
  }
}
export default RegisterPhysician;
