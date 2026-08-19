from agent import Agent

def main():
    agent = Agent()
    try:
        agent.run()
    except KeyboardInterrupt:
        print("Telemetry generator stopped.")

if __name__ == "__main__":
    main()