module Seeds
  # Creates the HR Manager login, or resets its password if it already exists,
  # from the HR_EMAIL and HR_PASSWORD environment variables. Outside production
  # it falls back to demo credentials so a fresh checkout can log in straight away.
  class HrManager
    DEMO_EMAIL = "hr@acme.example"
    DEMO_PASSWORD = "acme-demo-password"

    def self.call(env: ENV, allow_demo_credentials: !Rails.env.production?)
      new(env:, allow_demo_credentials:).call
    end

    def initialize(env:, allow_demo_credentials:)
      @env = env
      @allow_demo_credentials = allow_demo_credentials
    end

    def call
      email_address = fetch("HR_EMAIL", DEMO_EMAIL)
      password = fetch("HR_PASSWORD", DEMO_PASSWORD)

      User.find_or_initialize_by(email_address:).tap do |user|
        user.update!(password:)
      end
    end

    private
      def fetch(key, demo_value)
        @env.fetch(key) do
          raise ArgumentError, "#{key} must be set" unless @allow_demo_credentials

          demo_value
        end
      end
  end
end
